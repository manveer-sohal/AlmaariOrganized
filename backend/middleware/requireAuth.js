import { authenticateBearerToken } from "./authenticateBearerToken.js";

/**
 * Requires a valid Auth0 access token. Sets `req.auth.sub` from the verified
 * token — never trust client-supplied auth0Id on protected routes.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const result = await authenticateBearerToken(req);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    req.auth = result.auth;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to validate authentication",
      details: error.message,
    });
  }
};
