/**
 * Attach X-Almaari-Service-Key for Express → Python service calls.
 * Secrets are server-only; never sent to browsers.
 */

import { safeEqualString } from "../services/idempotency.service.js";

export const SERVICE_KEY_HEADER = "X-Almaari-Service-Key";

const isProduction = () => {
  const env = (process.env.NODE_ENV || "").toLowerCase();
  return env === "production" || env === "prod";
};

export const getCropServiceApiKey = () =>
  process.env.CROP_SERVICE_API_KEY || "";

export const getAiClothingServiceApiKey = () =>
  process.env.AI_CLOTHING_SERVICE_API_KEY || "";

/**
 * In production, fail fast when a service URL is set without its API key
 * (unless ALLOW_INSECURE_SERVICE_AUTH=true for emergency break-glass).
 */
export const assertServiceAuthConfig = () => {
  if (process.env.ALLOW_INSECURE_SERVICE_AUTH === "true") {
    return { ok: true, insecure: true };
  }
  if (!isProduction()) {
    return { ok: true, insecure: false };
  }

  const problems = [];
  if (process.env.CROP_SERVICE_URL && !getCropServiceApiKey()) {
    problems.push("CROP_SERVICE_API_KEY required when CROP_SERVICE_URL is set");
  }
  if (process.env.AI_CLOTHING_SERVICE_URL && !getAiClothingServiceApiKey()) {
    problems.push(
      "AI_CLOTHING_SERVICE_API_KEY required when AI_CLOTHING_SERVICE_URL is set",
    );
  }
  if (problems.length) {
    const err = new Error(problems.join("; "));
    err.code = "SERVICE_AUTH_CONFIG";
    throw err;
  }
  return { ok: true, insecure: false };
};

export const serviceAuthHeaders = (service) => {
  const key =
    service === "crop"
      ? getCropServiceApiKey()
      : service === "fastapi-ai" || service === "ai"
        ? getAiClothingServiceApiKey()
        : "";
  if (!key) return {};
  return { [SERVICE_KEY_HEADER]: key };
};

/** Express middleware for internal worker routes (enrichment reclaim). */
export const requireWorkerSecret = (req, res, next) => {
  const expected = process.env.ENRICHMENT_WORKER_SECRET || "";
  if (!expected) {
    if (process.env.NODE_ENV === "test") return next();
    return res.status(503).json({ error: "Worker secret not configured" });
  }
  const provided =
    req.get(SERVICE_KEY_HEADER) ||
    req.get("X-Enrichment-Worker-Secret") ||
    "";
  if (!safeEqualString(provided, expected)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
};
