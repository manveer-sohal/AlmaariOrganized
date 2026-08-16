type TokenCache = {
  token: string;
  expiresAt: number;
};

let cache: TokenCache | null = null;
let inFlight: Promise<string> | null = null;

const REFRESH_BUFFER_MS = 60_000;
const FALLBACK_TTL_MS = 5 * 60_000;

function parseJwtExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isCacheValid(entry: TokenCache | null): entry is TokenCache {
  return !!entry && Date.now() < entry.expiresAt - REFRESH_BUFFER_MS;
}

/** Clear cached bearer token (e.g. after a 401). */
export function clearAuthTokenCache() {
  cache = null;
  inFlight = null;
}

async function fetchAccessToken(): Promise<string> {
  const response = await fetch("/api/auth/access-token", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("You must be logged in to continue.");
  }

  const data = (await response.json()) as { accessToken?: string };
  if (!data.accessToken) {
    throw new Error("You must be logged in to continue.");
  }

  const jwtExp = parseJwtExpiry(data.accessToken);
  cache = {
    token: data.accessToken,
    expiresAt: jwtExp ?? Date.now() + FALLBACK_TTL_MS,
  };

  return data.accessToken;
}

async function getAccessToken(): Promise<string> {
  if (isCacheValid(cache)) {
    return cache.token;
  }

  if (!inFlight) {
    inFlight = fetchAccessToken().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

/**
 * Returns Authorization headers for authenticated backend API calls.
 * Reuses a short-lived in-memory token until near JWT expiry; concurrent
 * callers share one in-flight refresh. Still uses cache: "no-store" on the
 * session route so browser 304 responses never break token refresh.
 */
export async function getAuthHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    ...extra,
    Authorization: `Bearer ${token}`,
  };
}
