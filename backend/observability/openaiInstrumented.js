import axios from "axios";
import { logError, logInfo } from "./logger.js";
import { observeMs, incMetric } from "./metrics.js";
import { classifyAiError, ErrorClass } from "./errors.js";
import { measureAsync } from "./timer.js";

/**
 * Instrumented OpenAI chat completion helper.
 * Never logs prompts or full model responses.
 */
export const instrumentedOpenAiChat = async ({
  apiKey,
  model,
  messages,
  temperature,
  responseFormat,
  timeoutMs = 20000,
  workflow = "outfit_reranking",
  attempt = 1,
}) => {
  logInfo("ai.inference.started", {
    workflow,
    model,
    attempt,
    messageCount: Array.isArray(messages) ? messages.length : 0,
  });

  const { result, error, durationMs, ok } = await measureAsync(() =>
    axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        temperature,
        response_format: responseFormat,
        messages,
      },
      {
        timeout: timeoutMs,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    ),
  );

  observeMs("openai.chat.completions.ms", durationMs);

  if (!ok) {
    const classified = classifyAiError(error, {
      status: error?.response?.status,
      code: error?.code,
    });
    // Prefer provider-specific classification when status is from OpenAI.
    const classification =
      error?.response?.status >= 500
        ? ErrorClass.MODEL_PROVIDER
        : classified.classification;

    incMetric("ai.openai.failed");
    logError("ai.inference.failed", {
      workflow,
      model,
      attempt,
      durationMs,
      classification,
      retryable: classified.retryable,
      status: error?.response?.status || classified.status,
      errorType: error?.code || error?.name,
      errorMessage: error?.message,
      destinationService: "openai",
    });
    throw error;
  }

  const usage = result.data?.usage || {};
  const choice = result.data?.choices?.[0];
  const content = choice?.message?.content;
  const finishReason = choice?.finish_reason;

  incMetric("ai.openai.success");
  logInfo("ai.inference.completed", {
    workflow,
    model,
    attempt,
    durationMs,
    success: true,
    finishReason,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    responseLength: typeof content === "string" ? content.length : undefined,
  });

  return {
    content,
    finishReason,
    usage: {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    },
    durationMs,
    raw: result.data,
  };
};
