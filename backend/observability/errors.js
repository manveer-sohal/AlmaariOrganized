export const ErrorClass = {
  VALIDATION: "validation_error",
  AUTH: "authentication_error",
  CREDITS: "insufficient_credits",
  RATE_LIMIT: "rate_limit_error",
  MODEL_TIMEOUT: "model_timeout",
  MODEL_PROVIDER: "model_provider_error",
  INVALID_OUTPUT: "invalid_model_output",
  DOWNSTREAM: "downstream_service_error",
  DATABASE: "database_error",
  STORAGE: "storage_error",
  IMAGE_PROCESSING: "image_processing_error",
  UNKNOWN: "unknown_error",
};

export const classifyAiError = (error, hints = {}) => {
  const status = error?.status || error?.response?.status || hints.status;
  const message = String(error?.message || error || "unknown");
  const code = error?.code || hints.code;

  if (status === 401 || /unauthor/i.test(message)) {
    return {
      classification: ErrorClass.AUTH,
      retryable: false,
      status: status || 401,
    };
  }
  if (status === 402 || /insufficient credits/i.test(message)) {
    return {
      classification: ErrorClass.CREDITS,
      retryable: false,
      status: 402,
    };
  }
  if (status === 400 || /required|invalid|validation/i.test(message)) {
    return {
      classification: ErrorClass.VALIDATION,
      retryable: false,
      status: status || 400,
    };
  }
  if (status === 429 || /rate limit/i.test(message)) {
    return {
      classification: ErrorClass.RATE_LIMIT,
      retryable: true,
      status: 429,
    };
  }
  if (
    status === 504 ||
    code === "ECONNABORTED" ||
    /timed out|timeout/i.test(message)
  ) {
    return {
      classification: ErrorClass.MODEL_TIMEOUT,
      retryable: true,
      status: status || 504,
    };
  }
  if (/no confident tags|invalid model|schema/i.test(message)) {
    return {
      classification: ErrorClass.INVALID_OUTPUT,
      retryable: false,
      status: status || 422,
    };
  }
  if (/crop|image processing/i.test(message) || hints.service === "crop") {
    return {
      classification: ErrorClass.IMAGE_PROCESSING,
      retryable: true,
      status: status || 502,
    };
  }
  if (
    status === 502 ||
    status === 503 ||
    /unavailable|failed|ECONNREFUSED/i.test(message) ||
    hints.service
  ) {
    return {
      classification: ErrorClass.DOWNSTREAM,
      retryable: true,
      status: status || 503,
    };
  }
  if (/mongo|database/i.test(message)) {
    return {
      classification: ErrorClass.DATABASE,
      retryable: true,
      status: status || 500,
    };
  }

  return {
    classification: ErrorClass.UNKNOWN,
    retryable: false,
    status: status || 500,
  };
};
