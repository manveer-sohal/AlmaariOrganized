import { verifyAuth0Jwt } from "./verifyAuth0Jwt.js";

const AUTH_DEBUG_ENABLED =
  process.env.AUTH_DEBUG === "1" || process.env.AUTH_DEBUG === "true";

const maskToken = (token) => {
  if (!token) return null;
  if (token.length <= 12) return `${token.slice(0, 4)}...${token.slice(-2)}`;
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
};

const logAuthDebug = (event, details = {}) => {
  if (!AUTH_DEBUG_ENABLED) return;
  console.log(`[auth-debug] ${event}`, details);
};

/**
 * Validates a Bearer JWT locally via JWKS and returns the caller's identity.
 */
export const authenticateBearerToken = async (req) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  logAuthDebug("auth-start", {
    path: req.originalUrl || req.url,
    method: req.method,
    hasAuthorizationHeader: Boolean(authHeader),
    tokenPreview: maskToken(token),
  });

  if (!token) {
    logAuthDebug("auth-missing-token", {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    return {
      error: {
        status: 401,
        message: "Missing bearer token in Authorization header",
      },
    };
  }

  // Integration tests use a fixed bearer token (see backend/test/testAuth.js).
  if (process.env.NODE_ENV === "test" && token === "test-access-token") {
    logAuthDebug("auth-test-bypass", {
      path: req.originalUrl || req.url,
      method: req.method,
    });
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
    logAuthDebug("auth-config-missing-domain", {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    return {
      error: {
        status: 500,
        message: "AUTH0_DOMAIN is not configured on the API server",
      },
    };
  }

  const audience = process.env.AUTH0_AUDIENCE;
  if (!audience) {
    logAuthDebug("auth-config-missing-audience", {
      path: req.originalUrl || req.url,
      method: req.method,
    });
    return {
      error: {
        status: 500,
        message: "AUTH0_AUDIENCE is not configured on the API server",
      },
    };
  }

  logAuthDebug("auth-jwt-verify-start", {
    path: req.originalUrl || req.url,
    method: req.method,
    audience,
  });

  const result = await verifyAuth0Jwt(token, {
    domain: auth0Domain,
    audience,
  });

  if (result.payload) {
    const { payload } = result;
    logAuthDebug("auth-jwt-success", {
      path: req.originalUrl || req.url,
      method: req.method,
      sub: payload.sub,
      email: payload.email ?? null,
    });
    return {
      auth: {
        sub: payload.sub,
        email: payload.email,
        claims: payload,
      },
    };
  }

  logAuthDebug("auth-jwt-failed", {
    path: req.originalUrl || req.url,
    method: req.method,
    reason: result.failure,
    tokenPreview: maskToken(token),
  });

  return {
    error: { status: 401, message: "Invalid or expired access token" },
  };
};
