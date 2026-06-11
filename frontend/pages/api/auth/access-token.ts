import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAccessToken,
  getSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

export default withApiAuthRequired(async function accessToken(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Never cache — browser 304 responses have no body and break token refresh
  // during purchase-status polling.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");

  try {
    const session = await getSession(req, res);
    let token: string | undefined;

    // Prefer getAccessToken so Auth0 can refresh an expired access token.
    try {
      const refreshed = await getAccessToken(req, res);
      token = refreshed.accessToken;
    } catch {
      // Without AUTH0_AUDIENCE this may throw; fall back to session tokens.
    }

    if (!token) {
      token = session?.accessToken as string | undefined;
    }

    // ID token is a stable JWT for the session lifetime; backend verifies via JWKS.
    if (!token) {
      token = session?.idToken as string | undefined;
    }

    if (!token) {
      return res.status(401).json({ error: "No access token in session" });
    }

    return res.status(200).json({ accessToken: token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to get access token";
    return res.status(401).json({ error: message });
  }
});
