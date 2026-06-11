import {
  isAiAnalyzeTimingEnabled,
  logAnalyzeStep,
} from "./aiAnalyzeTiming";

/** Tunable defaults for AI clothing analysis payloads (analyze-only; not upload). */
export const AI_ANALYSIS_IMAGE_CONFIG = {
  /** 768px + higher quality preserves garment colour better than heavy 1024 JPEG. */
  maxLongestSide: 768,
  jpegQuality: 0.82,
  mimeType: "image/jpeg" as const,
  /** Reject optimization for extremely small sources (fallback still attempted). */
  minDimension: 32,
};

export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read image"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });

const loadImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image"));
    };
    img.src = objectUrl;
  });
};

const getTargetDimensions = (
  width: number,
  height: number,
  maxLongestSide: number,
) => {
  const longestSide = Math.max(width, height);
  if (longestSide <= maxLongestSide) {
    return { width, height };
  }
  const scale = maxLongestSide / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

/**
 * Resize/compress an image for AI analysis (longest side capped, JPEG output).
 * Returns a data URL suitable for the existing analyze API contract.
 */
export const optimizeImageForAnalysis = async (
  source: Blob,
  traceId?: string,
): Promise<string> => {
  const { maxLongestSide, jpegQuality, mimeType, minDimension } =
    AI_ANALYSIS_IMAGE_CONFIG;

  const decodeStart = performance.now();
  const img = await loadImageFromBlob(source);
  if (traceId && isAiAnalyzeTimingEnabled()) {
    logAnalyzeStep(traceId, "image decode (load into canvas)", performance.now() - decodeStart);
  }
  const { naturalWidth, naturalHeight } = img;

  if (naturalWidth < minDimension || naturalHeight < minDimension) {
    throw new Error(
      `Image is too small for analysis (minimum ${minDimension}px per side)`,
    );
  }

  const { width, height } = getTargetDimensions(
    naturalWidth,
    naturalHeight,
    maxLongestSide,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available");
  }

  const resizeStart = performance.now();
  ctx.drawImage(img, 0, 0, width, height);
  if (traceId && isAiAnalyzeTimingEnabled()) {
    logAnalyzeStep(traceId, "resize/compress (canvas draw)", performance.now() - resizeStart);
  }

  const encodeStart = performance.now();
  const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      jpegQuality,
    );
  });

  const dataUrl = await blobToDataUrl(optimizedBlob);
  if (traceId && isAiAnalyzeTimingEnabled()) {
    logAnalyzeStep(traceId, "base64 encode (optimized JPEG)", performance.now() - encodeStart);
    const kb = Math.round((dataUrl.length * 3) / 4 / 1024);
    console.log(`[AI Analyze][${traceId}][Frontend] optimized payload ~${kb} KB`);
  }
  return dataUrl;
};

/**
 * Prefer an optimized payload; fall back to the original blob as base64 on failure.
 */
export const prepareImagePayloadForAnalysis = async (
  source: Blob,
  traceId?: string,
): Promise<string> => {
  const optimizeStart = performance.now();
  try {
    const result = await optimizeImageForAnalysis(source, traceId);
    if (traceId && isAiAnalyzeTimingEnabled()) {
      logAnalyzeStep(traceId, "image optimization (total)", performance.now() - optimizeStart);
    }
    return result;
  } catch (error) {
    if (traceId && isAiAnalyzeTimingEnabled()) {
      logAnalyzeStep(
        traceId,
        "image optimization failed (falling back)",
        performance.now() - optimizeStart,
      );
    }
    console.warn(
      "[analyze] Image optimization failed, using original image:",
      error,
    );
    const fallbackStart = performance.now();
    const fallback = await blobToDataUrl(source);
    if (traceId && isAiAnalyzeTimingEnabled()) {
      logAnalyzeStep(traceId, "base64 encode (fallback original)", performance.now() - fallbackStart);
    }
    return fallback;
  }
};
