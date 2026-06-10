/** Clear cached bearer token (legacy no-op; kept for callers after 401). */
export function clearAuthTokenCache() {
  // Tokens are always fetched fresh from the session route.
}

/**
 * Returns Authorization headers for authenticated backend API calls.
 * Always fetches a fresh token from the Auth0 session route (no client cache)
 * so purchase-status polling never reuses a stale or 304-cached empty response.
 */
export async function getAuthHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
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

  return {
    ...extra,
    Authorization: `Bearer ${data.accessToken}`,
  };
}
