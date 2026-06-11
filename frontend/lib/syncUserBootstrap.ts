/**
 * Server-only post-Auth0 user bootstrap. Requires INTERNAL_API_SECRET on the
 * Next.js server and the same value on the API (never use NEXT_PUBLIC_).
 */
export async function syncUserOnLogin(
  apiBaseUrl: string,
  auth0Id: string,
  email: string | undefined,
): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error(
      "[auth] INTERNAL_API_SECRET is not set; skipping user bootstrap",
    );
    return;
  }

  if (!email) {
    console.error("[auth] No email on Auth0 session; skipping user bootstrap");
    return;
  }

  const response = await fetch(`${apiBaseUrl}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Api-Secret": secret,
    },
    body: JSON.stringify({ auth0Id, email }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `User bootstrap failed (${response.status}): ${text || response.statusText}`,
    );
  }
}
