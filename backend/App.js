import express from "express";
import cors from "cors";
import clothesRoutes from "./routes/clothesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import aiStylistRoutes from "./routes/aiStylistRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import internalRoutes from "./routes/internalRoutes.js";
import { stripeWebhook } from "./controllers/billingController.js";
import connectMongoDB from "./libs/mongodb.js";
import { redis } from "./libs/redis.client.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";
import { getMetricsSnapshot } from "./observability/metrics.js";
import { assertServiceAuthConfig } from "./utils/serviceAuth.js";
import { processDueEnrichmentJobs } from "./services/enrichmentJob.service.js";
import { logWarn } from "./observability/logger.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
if (process.env.NODE_ENV !== "test") {
  await connectMongoDB();
  try {
    assertServiceAuthConfig();
  } catch (err) {
    console.error("[startup] service auth config:", err.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
  // Reclaim durable enrichment jobs left by prior instances (best-effort).
  setTimeout(() => {
    processDueEnrichmentJobs({ limit: 10 }).catch((err) => {
      logWarn("enrichment_startup_reclaim_failed", {
        errorMessage: err?.message,
      });
    });
  }, 2000);
}
//!!! unistall mongoose from front end !!!!
const app = express();
const port = process.env.PORT || 8080;

// Honor X-Forwarded-For when behind a reverse proxy (rate limits, logs).
app.set("trust proxy", 1);
app.all(/^\/(__ok|healthz|health)$/, (_req, res) => res.status(200).send("ok"));

app.get("/__ok", (_req, res) => res.status(200).send("ok"));

app.get("/healthz", (_req, res) =>
  res.status(200).send("ok! All systems go!!"),
);
app.get("/health", (_req, res) => res.status(200).send("ok"));
app.head("/health", (_req, res) => res.sendStatus(200));

app.get("/", (_req, res) => res.send("Go to /health for health check"));

/**
 * Process liveness is /health. Readiness checks essential local deps only
 * (no OpenAI / FastAPI / crop probes — those are expensive and optional).
 */
app.get("/ready", async (_req, res) => {
  const checks = {
    mongodb: mongoose.connection.readyState === 1,
    redis: false,
    auth0DomainConfigured: Boolean(process.env.AUTH0_DOMAIN),
  };

  try {
    if (redis && typeof redis.ping === "function") {
      await redis.ping();
      checks.redis = true;
    } else {
      checks.redis = true;
    }
  } catch {
    // Cache is optional; API continues without Redis.
    checks.redis = false;
  }

  // Opportunistic enrichment reclaim on readiness probes (bounded).
  if (checks.mongodb && process.env.NODE_ENV !== "test") {
    processDueEnrichmentJobs({ limit: 2 }).catch(() => {});
  }

  const ready =
    process.env.NODE_ENV === "test"
      ? true
      : checks.mongodb && checks.auth0DomainConfigured;
  return res.status(ready ? 200 : 503).json({
    ready,
    checks,
  });
});

/** Lightweight in-process metrics snapshot for operators / future exporters. */
app.get("/metrics/ai", (_req, res) => {
  res.status(200).json(getMetricsSnapshot());
});

//middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
    exposedHeaders: ["x-request-id"],
  }),
);

// Stripe webhook MUST be registered with the raw body parser BEFORE the JSON
// parser, otherwise signature verification fails. It reads the unparsed body.
app.post(
  "/api/billing/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(express.json({ limit: "5mb" }));
app.use(requestContextMiddleware);

// Mount routes BEFORE starting the server to avoid cold-start race conditions
app.use("/api/clothes", clothesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/aiStylist", aiStylistRoutes);
app.use("/api/ai-stylist", aiStylistRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/internal", internalRoutes);

export default app;
