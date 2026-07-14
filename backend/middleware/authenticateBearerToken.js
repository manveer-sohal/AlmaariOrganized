import { verifyAuth0Jwt } from "./verifyAuth0Jwt.js";

/**
 * Validates a Bearer JWT locally via JWKS and returns the caller's identity.
 */
export const authenticateBearerToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return {
      error: {
        status: 401,
        message: "Missing bearer token in Authorization header",
      },
    };
  }

  // Integration tests use a fixed bearer token (see backend/test/testAuth.js).
  if (process.env.NODE_ENV === "test" && token === "test-access-token") {
    return {
      auth: {
        sub: "test-auth0-id",
        email: "test@example.com",
        claims: { sub: "test-auth0-id", email: "test@example.com" },
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

  const audience = process.env.AUTH0_AUDIENCE;
  if (!audience) {
    return {
      error: {
        status: 500,
        message: "AUTH0_AUDIENCE is not configured on the API server",
      },
    };
  }

  const result = await verifyAuth0Jwt(token, {
    domain: auth0Domain,
    audience,
  });

  if (result.payload) {
    const { payload } = result;
    return {
      auth: {
        sub: payload.sub,
        email: payload.email,
        claims: payload,
      },
    };
  }

  return {
    error: { status: 401, message: "Invalid or expired access token" },
  };
};
