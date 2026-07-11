import { createHash } from "crypto";
import { getRequestContext } from "./requestContext.js";

const SERVICE = process.env.SERVICE_NAME || "almaari-api";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "token",
  "secret",
  "password",
  "image",
  "base64",
  "prompt",
  "response",
  "accesstoken",
  "refreshtoken",
  "card",
  "stripe",
  "apikey",
]);

export const hashUserId = (userId) => {
  if (!userId || typeof userId !== "string") return undefined;
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
};

const redactValue = (key, value) => {
  if (SENSITIVE_KEYS.has(String(key).toLowerCase())) return "[REDACTED]";
  if (typeof value === "string" && value.startsWith("data:image")) {
    return "[REDACTED_IMAGE]";
  }
  if (typeof value === "string" && value.length > 500) {
    return `${value.slice(0, 80)}…[truncated ${value.length} chars]`;
  }
  return value;
};

const sanitizeFields = (fields = {}) => {
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeFields(value);
    } else {
      out[key] = redactValue(key, value);
    }
  }
  return out;
};

export const logEvent = (level, event, fields = {}) => {
  const ctx = getRequestContext() || {};
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: SERVICE,
    requestId: fields.requestId || ctx.requestId || null,
    workflow: fields.workflow || ctx.workflow || undefined,
    route: fields.route || ctx.route || undefined,
    method: fields.method || ctx.method || undefined,
    ...sanitizeFields({
      ...fields,
      requestId: undefined,
      workflow: undefined,
      route: undefined,
      method: undefined,
    }),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};

export const logInfo = (event, fields) => logEvent("info", event, fields);
export const logWarn = (event, fields) => logEvent("warn", event, fields);
export const logError = (event, fields) => logEvent("error", event, fields);
