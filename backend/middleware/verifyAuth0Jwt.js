import crypto from "crypto";

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
  if (!response.ok) return null;

  const { keys } = await response.json();
  jwksCache = { domain, keys, fetchedAt: now };
  return keys;
};

/**
 * Verifies an Auth0-issued JWT (typically the ID token) via JWKS.
 * Used as a fallback when /userinfo rejects opaque or expired access tokens.
 */
export const verifyAuth0Jwt = async (token, { domain, audience }) => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]).toString("utf-8"));
    payload = JSON.parse(base64UrlDecode(parts[1]).toString("utf-8"));
  } catch {
    return null;
  }

  if (payload.exp && payload.exp * 1000 <= Date.now()) return null;

  const issuer = `https://${domain}/`;
  if (payload.iss !== issuer) return null;

  if (audience) {
    const aud = payload.aud;
    const audOk =
      aud === audience || (Array.isArray(aud) && aud.includes(audience));
    if (!audOk) return null;
  }

  const keys = await getJwksKeys(domain);
  const jwk = keys?.find((key) => key.kid === header.kid);
  if (!jwk) return null;

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = base64UrlDecode(parts[2]);
  const valid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(signingInput),
    publicKey,
    signature,
  );

  if (!valid || !payload.sub) return null;
  return payload;
};
