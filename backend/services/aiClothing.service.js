import axios from "axios";
import dotenv from "dotenv";
import { performance } from "node:perf_hooks";
import {
  countValidTags,
  sanitizeTagsPayload,
} from "../utils/tagValidation.utils.js";
import {
  logAnalyzeStep,
  logAnalyzeTotal,
  measureAnalyzeStep,
} from "../utils/aiAnalyzeTiming.js";
import { deductOneCredit, getCreditBalance } from "./credit.service.js";

dotenv.config();

const AI_CLOTHING_SERVICE_URL = process.env.AI_CLOTHING_SERVICE_URL;
const AI_CLOTHING_TIMEOUT_MS = Number(
  process.env.AI_CLOTHING_TIMEOUT_MS || 60000,
);
const AI_WARMUP_TIMEOUT_MS = Number(process.env.AI_WARMUP_TIMEOUT_MS || 8000);

const stripDataUrl = (image) => {
  const trimmed = String(image || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex === -1) return "";
    return trimmed.slice(commaIndex + 1);
  }
  return trimmed;
};

export const callAiClothingService = async (image, requestId) => {
  const stripStart = performance.now();
  const payloadImage = stripDataUrl(image);
  logAnalyzeStep(
    requestId,
    "strip data URL / prep payload",
    performance.now() - stripStart,
  );

  if (!payloadImage) {
    throw { status: 400, message: "image is required" };
  }

  const payloadKb = Math.round((payloadImage.length * 3) / 4 / 1024);

  try {
    const fastApiStart = performance.now();
    const response = await axios.post(
      `${AI_CLOTHING_SERVICE_URL}/analyze-clothing`,
      { image: payloadImage },
      {
        timeout: AI_CLOTHING_TIMEOUT_MS,
        headers: {
          "Content-Type": "application/json",
          ...(requestId ? { "X-Request-Id": requestId } : {}),
        },
      },
    );
    logAnalyzeStep(
      requestId,
      `FastAPI HTTP round-trip (~${payloadKb} KB payload)`,
      performance.now() - fastApiStart,
    );

    const sanitizeStart = performance.now();
    const tags = sanitizeTagsPayload(response.data);
    const validTagCount = countValidTags(tags);
    logAnalyzeStep(
      requestId,
      "response sanitize / tag validation",
      performance.now() - sanitizeStart,
    );

    return { tags, validTagCount };
  } catch (error) {
    if (error.status) throw error;

    if (error.code === "ECONNABORTED") {
      throw {
        status: 504,
        message: "Clothing analysis timed out",
      };
    }

    if (error.response) {
      const detail =
        error.response.data?.detail ||
        error.response.data?.message ||
        "Clothing analysis failed";
      throw {
        status: error.response.status >= 500 ? 502 : error.response.status,
        message: typeof detail === "string" ? detail : JSON.stringify(detail),
      };
    }

    throw {
      status: 503,
      message: "Clothing analysis service unavailable",
    };
  }
};

/** Wake FastAPI worker; no analysis, no credits, no OpenAI inference. */
export const warmupAiClothingService = async (requestId) => {
  const warmupStart = performance.now();
  try {
    await axios.get(`${AI_CLOTHING_SERVICE_URL}/warmup`, {
      timeout: AI_WARMUP_TIMEOUT_MS,
      headers: requestId ? { "X-Request-Id": requestId } : {},
    });
    logAnalyzeStep(
      requestId || "warmup",
      "FastAPI warmup",
      performance.now() - warmupStart,
    );
    return { success: true };
  } catch (error) {
    logAnalyzeStep(
      requestId || "warmup",
      "FastAPI warmup failed (non-fatal)",
      performance.now() - warmupStart,
    );
    throw {
      status: error.response?.status || 503,
      message: "AI service warmup failed",
    };
  }
};

export const analyzeClothingForUser = async ({ auth0Id, image, requestId }) => {
  const serviceStart = performance.now();

  const creditBalance = await measureAnalyzeStep(
    requestId,
    "credit lookup (getCreditBalance)",
    () => getCreditBalance(auth0Id),
  );

  if (creditBalance < 1) {
    throw {
      status: 402,
      message: "Insufficient credits. At least 1 credit is required.",
      creditBalance,
    };
  }

  const { tags, validTagCount } = await callAiClothingService(image, requestId);

  let creditsDeducted = 0;
  let updatedBalance = creditBalance;

  if (validTagCount >= 1) {
    const deduction = await measureAnalyzeStep(
      requestId,
      "credit deduction (deductOneCredit)",
      () => deductOneCredit(auth0Id),
    );
    creditsDeducted = deduction.creditsDeducted;
    updatedBalance = deduction.creditBalance;
  } else {
    logAnalyzeStep(
      requestId,
      "credit deduction skipped (validTagCount < 1)",
      0,
    );
  }

  logAnalyzeTotal(
    requestId,
    "total service (analyzeClothingForUser)",
    serviceStart,
  );

  return {
    tags,
    validTagCount,
    creditsDeducted,
    creditBalance: updatedBalance,
  };
};
