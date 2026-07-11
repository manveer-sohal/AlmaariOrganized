import axios from "axios";
import { logError, logInfo } from "./logger.js";
import { observeMs, incMetric } from "./metrics.js";
import { classifyAiError } from "./errors.js";
import { getRequestId, REQUEST_ID_HEADER } from "./requestContext.js";
import { measureAsync } from "./timer.js";

/**
 * Instrumented outbound HTTP call used for FastAPI / crop services.
 * Does not log request/response bodies.
 */
export const callDownstream = async ({
  service,
  method = "GET",
  url,
  data,
  timeout,
  workflow,
  headers = {},
}) => {
  const requestId = getRequestId();
  const attempt = 1;

  logInfo("ai.downstream.started", {
    workflow,
    destinationService: service,
    endpoint: url,
    method,
    attempt,
    timeoutMs: timeout,
  });

  const { result, error, durationMs, ok } = await measureAsync(() =>
    axios.request({
      method,
      url,
      data,
      timeout,
      headers: {
        ...headers,
        ...(requestId ? { [REQUEST_ID_HEADER]: requestId } : {}),
      },
      validateStatus: () => true,
    }),
  );

  observeMs(`downstream.${service}.ms`, durationMs);

  if (!ok) {
    const classified = classifyAiError(error, { service });
    incMetric(`ai.downstream.${service}.failed`);
    logError("ai.downstream.failed", {
      workflow,
      destinationService: service,
      endpoint: url,
      method,
      attempt,
      durationMs,
      classification: classified.classification,
      retryable: classified.retryable,
      status: classified.status,
      errorType: error?.code || error?.name,
      errorMessage: error?.message,
    });
    throw {
      status: classified.status,
      message: error?.message || `${service} request failed`,
      classification: classified.classification,
      retryable: classified.retryable,
    };
  }

  const statusCode = result.status;
  if (statusCode >= 400) {
    incMetric(`ai.downstream.${service}.failed`);
    const detail =
      result.data?.detail ||
      result.data?.message ||
      `${service} returned ${statusCode}`;
    const classified = classifyAiError(
      { status: statusCode, message: String(detail) },
      { service },
    );
    logError("ai.downstream.failed", {
      workflow,
      destinationService: service,
      endpoint: url,
      method,
      attempt,
      durationMs,
      status: statusCode,
      classification: classified.classification,
      retryable: classified.retryable,
      errorMessage: typeof detail === "string" ? detail : "downstream error",
    });
    throw {
      status: statusCode >= 500 ? 502 : statusCode,
      message: typeof detail === "string" ? detail : JSON.stringify(detail),
      classification: classified.classification,
      retryable: classified.retryable,
    };
  }

  incMetric(`ai.downstream.${service}.success`);
  logInfo("ai.downstream.completed", {
    workflow,
    destinationService: service,
    endpoint: url,
    method,
    attempt,
    durationMs,
    status: statusCode,
    success: true,
  });

  return { data: result.data, status: statusCode, durationMs };
};
