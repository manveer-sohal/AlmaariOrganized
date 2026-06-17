import crypto from "crypto";

const AUTH_DEBUG_ENABLED =
  process.env.AUTH_DEBUG === "1" || process.env.AUTH_DEBUG === "true";

const logAuthDebug = (event, details = {}) => {
  if (!AUTH_DEBUG_ENABLED) return;
  console.log(`[auth-debug] ${event}`, details);
};

const base64UrlDecode = (str) => {
  const normalized = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return Buffer.from(padded, "base64");
};

let jwksCache = { domain: null, keys: null, fetchedAt: 0 };
const JWKS_TTL_MS = 60 * 60 * 1000;

const getJwksKeys = async (domain) => {
  const now = Date.now();
  if (
    jwksCache.domain === domain &&
    jwksCache.keys &&
    now - jwksCache.fetchedAt < JWKS_TTL_MS
  ) {
    return jwksCache.keys;
  }

  const response = await fetch(`https://${domain}/.well-known/jwks.json`);
  if (!response.ok) {
    logAuthDebug("auth-jwks-fetch-failed", {
      domain,
      status: response.status,
    });
    return null;
  }

  const { keys } = await response.json();
  jwksCache = { domain, keys, fetchedAt: now };
  return keys;
};

const audienceMatches = (tokenAud, expectedAudience) => {
  if (!expectedAudience) return true;
  if (!tokenAud) return false;
  if (Array.isArray(tokenAud)) {
    return tokenAud.includes(expectedAudience);
  }
  return tokenAud === expectedAudience;
};

/**
 * Verifies an Auth0-issued JWT access token via JWKS.
 * Returns { payload } on success or { failure } with a machine-readable reason.
 */
export const verifyAuth0Jwt = async (token, { domain, audience }) => {
  const parts = token.split(".");
  console.log("parts", parts);
  if (parts.length !== 3) {
    logAuthDebug("auth-jwt-invalid-format", { partCount: parts.length });
    return { failure: "invalid-jwt-format" };
  }

  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]).toString("utf-8"));
    payload = JSON.parse(base64UrlDecode(parts[1]).toString("utf-8"));
  } catch {
    logAuthDebug("auth-jwt-decode-failed");
    return { failure: "invalid-jwt-encoding" };
  }

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    logAuthDebug("auth-jwt-expired", { exp: payload.exp });
    return { failure: "expired-token" };
  }

  const issuer = `https://${domain}/`;
  if (payload.iss !== issuer) {
    logAuthDebug("auth-jwt-issuer-mismatch", {
      expected: issuer,
      actual: payload.iss ?? null,
    });
    return { failure: "issuer-mismatch" };
  }

  if (!audienceMatches(payload.aud, audience)) {
    logAuthDebug("auth-jwt-audience-mismatch", {
      expectedAudience: audience,
      tokenAudience: payload.aud ?? null,
    });
    return { failure: "audience-mismatch" };
  }

  const keys = await getJwksKeys(domain);
  const jwk = keys?.find((key) => key.kid === header.kid);
  if (!jwk) {
    logAuthDebug("auth-jwt-signing-key-not-found", { kid: header.kid ?? null });
    return { failure: "signing-key-not-found" };
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = base64UrlDecode(parts[2]);
  const valid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(signingInput),
    publicKey,
    signature,
  );

  if (!valid) {
    logAuthDebug("auth-jwt-signature-invalid", { kid: header.kid ?? null });
    return { failure: "signature-invalid" };
  }

  if (!payload.sub) {
    logAuthDebug("auth-jwt-missing-sub");
    return { failure: "missing-sub" };
  }

  return { payload };
};
