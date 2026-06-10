import { verifyAuth0Jwt } from "./verifyAuth0Jwt.js";

/**
 * Validates a Bearer token against Auth0 and returns the caller's identity.
 * Tries /userinfo first (opaque access tokens), then JWKS verification for
 * JWT ID/access tokens — the latter is more reliable during long polling.
 */
export const authenticateBearerToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  if (!token) {
    return {
      error: {
        status: 401,
        message: "Missing bearer token in Authorization header",
      },
    };
  }

  const auth0Domain = process.env.AUTH0_DOMAIN;
  if (!auth0Domain) {
    return {
      error: {
        status: 500,
        message: "AUTH0_DOMAIN is not configured on the API server",
      },
    };
  }

  const auth0Response = await fetch(`https://${auth0Domain}/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (auth0Response.ok) {
    const userinfo = await auth0Response.json();
    if (userinfo?.sub) {
      return {
        auth: {
          sub: userinfo.sub,
          email: userinfo.email,
          claims: userinfo,
        },
      };
    }
  }

  // Fallback: verify JWT ID/access tokens via JWKS (session idToken path).
  const clientId = process.env.AUTH0_CLIENT_ID;
  if (clientId) {
    const payload = await verifyAuth0Jwt(token, {
      domain: auth0Domain,
      audience: clientId,
    });
    if (payload?.sub) {
      return {
        auth: {
          sub: payload.sub,
          email: payload.email,
          claims: payload,
        },
      };
    }
  }

  return {
    error: { status: 401, message: "Invalid or expired access token" },
  };
};
