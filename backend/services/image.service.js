import dotenv from "dotenv";
import axios from "axios";
import { performance } from "node:perf_hooks";
import { logAnalyzeStep } from "../utils/aiAnalyzeTiming.js";

dotenv.config();

const CROP_SERVICE_URL = process.env.CROP_SERVICE_URL;
const CROP_WARMUP_TIMEOUT_MS = Number(
  process.env.CROP_WARMUP_TIMEOUT_MS || 8000,
);

export const toBase64 = (file) => {
  return `data:image/png;base64,${file.toString("base64")}`;
};

export const cropImage = async (base64Image) => {
  const res = await axios.post(
    `${CROP_SERVICE_URL}/crop`,
    {
      image: base64Image,
    },
    {
      timeout: 15000,
    },
  );

  return res.data.image;
};

/** Wake crop worker; no image processing. */
export const warmupCropService = async (requestId) => {
  if (!CROP_SERVICE_URL) {
    logAnalyzeStep(requestId || "warmup", "crop warmup skipped (no URL)", 0);
    return { success: false, skipped: true };
  }

  const warmupStart = performance.now();
  try {
    await axios.get(`${CROP_SERVICE_URL}/warmup`, {
      timeout: CROP_WARMUP_TIMEOUT_MS,
      headers: requestId ? { "X-Request-Id": requestId } : {},
    });
    logAnalyzeStep(
      requestId || "warmup",
      "crop service warmup",
      performance.now() - warmupStart,
    );
    return { success: true };
  } catch (error) {
    logAnalyzeStep(
      requestId || "warmup",
      "crop service warmup failed (non-fatal)",
      performance.now() - warmupStart,
    );
    throw {
      status: error.response?.status || 503,
      message: "Crop service warmup failed",
    };
  }
};
