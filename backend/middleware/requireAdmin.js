import { authenticateBearerToken } from "./authenticateBearerToken.js";
import connectMongoDB from "../libs/mongodb.js";
import { User } from "../models/Users.js";

const DEFAULT_ROLES_CLAIM = "https://almaariorganizer.com/roles";

export const requireAdmin = async (req, res, next) => {
  try {
    const result = await authenticateBearerToken(req);
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }

    const { claims, sub, email } = result.auth;
    const rolesClaimKey = process.env.AUTH0_ROLES_CLAIM || DEFAULT_ROLES_CLAIM;
    const rolesFromClaim = claims[rolesClaimKey];
    const roles =
      Array.isArray(rolesFromClaim) && rolesFromClaim.length > 0
        ? rolesFromClaim
        : Array.isArray(claims.roles)
          ? claims.roles
          : [];

    let isAdmin = roles.includes("admin");

    if (!isAdmin && sub) {
      await connectMongoDB();
      const user = await User.findOne({ auth0Id: sub }, { role: 1 });
      isAdmin = user?.role === "admin";
    }

    if (!isAdmin) {
      return res.status(403).json({ error: "Admin role required" });
    }

    req.auth = {
      sub,
      email,
      roles: roles.length > 0 ? roles : ["admin"],
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      error: "Failed to validate admin access",
      details: error.message,
    });
  }
};
