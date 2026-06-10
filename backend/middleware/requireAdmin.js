import { authenticateBearerToken } from "./authenticateBearerToken.js";

const DEFAULT_ROLES_CLAIM = "https://almaariorganizer.com/roles";

export const requireAdmin = async (req, res, next) => {
  try {
    const result = await authenticateBearerToken(req);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    const { claims } = result.auth;
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
      sub: result.auth.sub,
      email: result.auth.email,
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
