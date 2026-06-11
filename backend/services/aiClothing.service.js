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
import {
  deductOneCredit,
  getCreditBalance,
  refundCredits,
} from "./credit.service.js";

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

  // Reserve one credit BEFORE the expensive AI call to prevent parallel abuse.
  let deduction;
  try {
    deduction = await measureAnalyzeStep(
      requestId,
      "credit reservation (deductOneCredit)",
      () => deductOneCredit(auth0Id),
    );
  } catch (error) {
    const balance = await getCreditBalance(auth0Id).catch(() => undefined);
    throw {
      status: error.status || 402,
      message: error.message || "Insufficient credits",
      creditBalance: balance,
    };
  }

  try {
    const { tags, validTagCount } = await callAiClothingService(
      image,
      requestId,
    );

    if (validTagCount < 1) {
      const refund = await measureAnalyzeStep(
        requestId,
        "credit refund (no confident tags)",
        () => refundCredits(auth0Id, 1),
      );
      logAnalyzeStep(
        requestId,
        "credit charge waived (validTagCount < 1)",
        0,
      );

      logAnalyzeTotal(
        requestId,
        "total service (analyzeClothingForUser)",
        serviceStart,
      );

      return {
        tags,
        validTagCount,
        creditsDeducted: 0,
        creditBalance: refund.creditBalance,
      };
    }

    logAnalyzeTotal(
      requestId,
      "total service (analyzeClothingForUser)",
      serviceStart,
    );

    return {
      tags,
      validTagCount,
      creditsDeducted: deduction.creditsDeducted,
      creditBalance: deduction.creditBalance,
    };
  } catch (error) {
    try {
      await refundCredits(auth0Id, 1);
    } catch (refundError) {
      console.error("[analyze] failed to refund reserved credit:", refundError);
    }

    const balance = await getCreditBalance(auth0Id).catch(
      () => deduction.creditBalance,
    );

    logAnalyzeTotal(
      requestId,
      "total service (analyzeClothingForUser, error)",
      serviceStart,
    );

    throw {
      status: error.status || 500,
      message: error.message || "Failed to analyze clothing image",
      creditBalance: balance,
    };
  }
};
