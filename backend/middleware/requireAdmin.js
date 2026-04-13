const DEFAULT_ROLES_CLAIM = "https://almaariorganizer.com/roles";

const decodeJwtPayload = (token) => {
  const [, payload] = token.split(".");
  if (!payload) return null;

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
};

export const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Missing bearer token in Authorization header" });
    }

    const auth0Domain = process.env.AUTH0_DOMAIN;
    if (!auth0Domain) {
      return res
        .status(500)
        .json({ error: "AUTH0_DOMAIN is not configured on the API server" });
    }

    // Validate token against Auth0 before trusting its claims.
    const auth0Response = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!auth0Response.ok) {
      return res.status(401).json({ error: "Invalid or expired access token" });
    }

    const claims = decodeJwtPayload(token) || {};
    const rolesClaimKey = process.env.AUTH0_ROLES_CLAIM || DEFAULT_ROLES_CLAIM;
    const rolesFromClaim = claims[rolesClaimKey];
    const roles =
      Array.isArray(rolesFromClaim) && rolesFromClaim.length > 0
        ? rolesFromClaim
        : Array.isArray(claims.roles)
          ? claims.roles
          : [];

    if (!roles.includes("admin")) {
      return res.status(403).json({ error: "Admin role required" });
    }

    req.auth = {
      sub: claims.sub,
      email: claims.email,
      roles,
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      error: "Failed to validate admin access",
      details: error.message,
    });
  }
};
