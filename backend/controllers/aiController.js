import { performance } from "node:perf_hooks";
import {
  analyzeClothingForUser,
  warmupAiClothingService,
} from "../services/aiClothing.service.js";
import { warmupCropService } from "../services/image.service.js";
import {
  logAnalyzeStep,
  logAnalyzeTotal,
  resolveAnalyzeRequestId,
} from "../utils/aiAnalyzeTiming.js";

export const warmupAiClothing = async (req, res) => {
  const requestId = resolveAnalyzeRequestId(req);

  const [aiResult, cropResult] = await Promise.allSettled([
    warmupAiClothingService(requestId),
    warmupCropService(requestId),
  ]);

  const aiWarmedUp = aiResult.status === "fulfilled";
  const cropWarmedUp = cropResult.status === "fulfilled";

  return res.status(200).json({
    success: aiWarmedUp && cropWarmedUp,
    aiWarmedUp,
    cropWarmedUp,
    message:
      aiWarmedUp && cropWarmedUp
        ? "AI and crop services warmed up"
        : "One or more warmups skipped or unavailable",
  });
};

export const analyzeClothing = async (req, res) => {
  const requestId = resolveAnalyzeRequestId(req);
  const controllerStart = performance.now();

  try {
    const validationStart = performance.now();
    const auth0Id = req.auth?.sub;
    const { image } = req.body;

    if (!auth0Id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        success: false,
        message: "image is required",
      });
    }

    const imageKb = Math.round(Buffer.byteLength(image, "utf8") / 1024);
    logAnalyzeStep(
      requestId,
      `request validation (image ~${imageKb} KB base64)`,
      performance.now() - validationStart,
    );

    const result = await analyzeClothingForUser({ auth0Id, image, requestId });

    logAnalyzeTotal(requestId, "total controller", controllerStart);

    return res.status(200).json({
      success: true,
      tags: result.tags,
      validTagCount: result.validTagCount,
      creditsDeducted: result.creditsDeducted,
      creditBalance: result.creditBalance,
      message:
        result.validTagCount >= 1
          ? "Analysis completed"
          : "Analysis completed with no confident tags",
    });
  } catch (error) {
    logAnalyzeTotal(requestId, "total controller (error)", controllerStart);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to analyze clothing image",
      creditBalance: error.creditBalance,
      creditsDeducted: 0,
    });
  }
};
