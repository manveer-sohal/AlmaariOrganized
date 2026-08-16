import { expect } from "chai";
import sinon from "sinon";
import express from "express";
import request from "supertest";
import axios from "axios";
import {
  resolveIncomingRequestId,
  runWithRequestContext,
  getRequestId,
  REQUEST_ID_HEADER,
} from "../observability/requestContext.js";
import { logInfo, logError, hashUserId } from "../observability/logger.js";
import { classifyAiError, ErrorClass } from "../observability/errors.js";
import {
  resetMetrics,
  getMetricsSnapshot,
  incMetric,
  observeMs,
} from "../observability/metrics.js";
import { requestContextMiddleware } from "../middleware/requestContext.js";
import { callDownstream } from "../observability/downstream.js";
import { instrumentedOpenAiChat } from "../observability/openaiInstrumented.js";
import { logPerfBaseline } from "../observability/perfBaseline.js";

describe("AI observability", () => {
  let logStub;
  let errorStub;

  beforeEach(() => {
    resetMetrics();
    logStub = sinon.stub(console, "log");
    errorStub = sinon.stub(console, "error");
    sinon.stub(console, "warn");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("generates a request id when absent", () => {
    const id = resolveIncomingRequestId({ headers: {} });
    expect(id).to.be.a("string");
    expect(id.length).to.be.greaterThan(8);
  });

  it("preserves an incoming x-request-id", () => {
    const id = resolveIncomingRequestId({
      headers: { "x-request-id": "client-trace-123" },
    });
    expect(id).to.equal("client-trace-123");
  });

  it("exposes request id on response headers via middleware", async () => {
    const app = express();
    app.use(express.json());
    app.use(requestContextMiddleware);
    app.post("/api/ai/ping", (req, res) => {
      res.status(200).json({ requestId: req.requestId, als: getRequestId() });
    });

    const res = await request(app)
      .post("/api/ai/ping")
      .set("x-request-id", "preserve-me")
      .send({});

    expect(res.status).to.equal(200);
    expect(res.headers[REQUEST_ID_HEADER]).to.equal("preserve-me");
    expect(res.body.requestId).to.equal("preserve-me");
    expect(res.body.als).to.equal("preserve-me");
  });

  it("forwards request id to downstream services", async () => {
    const requestStub = sinon.stub(axios, "request").resolves({
      status: 200,
      data: { ok: true },
    });

    await runWithRequestContext(
      { requestId: "fwd-id-1", workflow: "test" },
      async () => {
        await callDownstream({
          service: "fastapi-ai",
          method: "POST",
          url: "http://example.test/analyze",
          data: { image: "not-logged" },
          timeout: 1000,
          workflow: "clothing_metadata_generation",
        });
      },
    );

    expect(requestStub.calledOnce).to.equal(true);
    expect(requestStub.firstCall.args[0].headers[REQUEST_ID_HEADER]).to.equal(
      "fwd-id-1",
    );
  });

  it("hashes user ids for safe logging", () => {
    const hash = hashUserId("auth0|user-1");
    expect(hash).to.have.length(12);
    expect(hash).to.not.include("auth0");
  });

  it("redacts sensitive fields from structured logs", () => {
    logInfo("test.event", {
      authorization: "Bearer secret-token",
      image: "data:image/png;base64,AAAA",
      wardrobeItemCount: 3,
    });
    expect(logStub.called).to.equal(true);
    const payload = JSON.parse(logStub.firstCall.args[0]);
    expect(payload.authorization).to.equal("[REDACTED]");
    expect(payload.image).to.equal("[REDACTED]");
    expect(payload.wardrobeItemCount).to.equal(3);
    expect(payload.event).to.equal("test.event");
  });

  it("emits classified error logs for failed AI requests", () => {
    const classified = classifyAiError({
      status: 504,
      message: "Clothing analysis timed out",
    });
    logError("ai.inference.failed", {
      classification: classified.classification,
      retryable: classified.retryable,
      status: classified.status,
      durationMs: 40,
    });
    const payload = JSON.parse(errorStub.firstCall.args[0]);
    expect(payload.classification).to.equal(ErrorClass.MODEL_TIMEOUT);
    expect(payload.retryable).to.equal(true);
    expect(payload.durationMs).to.be.at.least(0);
  });

  it("classifies AI errors", () => {
    expect(
      classifyAiError({ status: 402, message: "Insufficient credits" })
        .classification,
    ).to.equal(ErrorClass.CREDITS);
    expect(
      classifyAiError({ code: "ECONNABORTED", message: "timeout" })
        .classification,
    ).to.equal(ErrorClass.MODEL_TIMEOUT);
    expect(
      classifyAiError({ status: 400, message: "image is required" })
        .classification,
    ).to.equal(ErrorClass.VALIDATION);
  });

  it("records metrics counters and non-negative timings", () => {
    incMetric("ai.requests.total");
    observeMs("ai.clothing_metadata_generation.ms", 15);
    const snap = getMetricsSnapshot();
    expect(snap.counters["ai.requests.total"]).to.equal(1);
    expect(
      snap.timings["ai.clothing_metadata_generation.ms"].avgMs,
    ).to.be.at.least(0);
  });

  it("emits greppable PERF_BASELINE lines for workflow totals", () => {
    logPerfBaseline({
      workflow: "outfit_recommendation",
      totalMs: 477.51,
      stages: { candidatesMs: 27.3 },
    });
    const lines = logStub.getCalls().map((c) => String(c.args[0]));
    expect(
      lines.some((line) =>
        line.includes("[PERF_BASELINE] workflow=outfit_recommendation"),
      ),
    ).to.equal(true);
    expect(
      lines.some(
        (line) =>
          typeof line === "string" &&
          line.includes('"event":"perf.baseline"') &&
          line.includes('"totalMs":477.51'),
      ),
    ).to.equal(true);
    const snap = getMetricsSnapshot();
    expect(snap.timings["perf.baseline.outfit_recommendation.ms"].count).to.equal(
      1,
    );
  });

  it("records OpenAI token usage when available without logging prompts", async () => {
    sinon.stub(axios, "post").resolves({
      data: {
        choices: [
          {
            message: { content: '{"ok":true}' },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      },
    });

    const result = await instrumentedOpenAiChat({
      apiKey: "sk-test",
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "secret prompt text" }],
      workflow: "outfit_reranking",
    });

    expect(result.usage.totalTokens).to.equal(15);
    const logged = logStub
      .getCalls()
      .map((c) => JSON.parse(c.args[0]))
      .find((p) => p.event === "ai.inference.completed");
    expect(logged.totalTokens).to.equal(15);
    expect(JSON.stringify(logged)).to.not.include("secret prompt text");
  });
});
