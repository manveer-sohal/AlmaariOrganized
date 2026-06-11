/**
 * Server-to-server guard for bootstrap endpoints (e.g. post-Auth0 user sync).
 * The secret must never be exposed to the browser (no NEXT_PUBLIC_ prefix).
 */
export const requireInternalApiSecret = (req, res, next) => {
  const expected = process.env.INTERNAL_API_SECRET;

  if (!expected) {
    console.error("[auth] INTERNAL_API_SECRET is not configured");
    return res.status(500).json({ error: "Server bootstrap is not configured" });
  }

  const provided = req.headers["x-internal-api-secret"];
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
};
