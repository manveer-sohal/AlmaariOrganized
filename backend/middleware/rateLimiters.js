import rateLimit from "express-rate-limit";

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    skip: () => process.env.NODE_ENV === "test",
  });

/** All /api/ai/* routes (warmup + analyze). */
export const aiRateLimiter = buildLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_AI_PER_MIN || 30),
  message: "Too many AI requests. Please try again shortly.",
});

/** Stricter cap on credit-consuming analyze endpoint. */
export const aiAnalyzeRateLimiter = buildLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_AI_ANALYZE_PER_MIN || 10),
  message: "Too many image analyses. Please wait before trying again.",
});

export const aiStylistRateLimiter = buildLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_AI_STYLIST_PER_MIN || 10),
  message: "Too many stylist requests. Please wait before trying again.",
});

export const uploadRateLimiter = buildLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_PER_MIN || 15),
  message: "Too many uploads. Please try again shortly.",
});

export const styleEnrichmentRetryLimiter = buildLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_STYLE_ENRICHMENT_RETRY_PER_MIN || 5),
  message: "Too many style enrichment retries. Please wait before trying again.",
});

export const weatherRateLimiter = buildLimiter({
  windowMs: 60_000,
  max: Number(process.env.RATE_LIMIT_WEATHER_PER_MIN || 30),
  message: "Too many weather requests. Please try again shortly.",
});

export const loginRateLimiter = buildLimiter({
  windowMs: 15 * 60_000,
  max: Number(process.env.RATE_LIMIT_LOGIN_PER_15_MIN || 30),
  message: "Too many login bootstrap attempts. Please try again later.",
});
