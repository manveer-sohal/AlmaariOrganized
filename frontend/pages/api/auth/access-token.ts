import type { NextApiRequest, NextApiResponse } from "next";
import {
  getAccessToken,
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

  const audience = process.env.AUTH0_AUDIENCE;
  if (!audience) {
    return res.status(500).json({
      error:
        "AUTH0_AUDIENCE is not configured. Set it to your Auth0 API identifier.",
    });
  }

  try {
    // getAccessToken refreshes the API access token when needed (requires
    // offline_access in AUTH0_SCOPE at login).
    const { accessToken: token } = await getAccessToken(req, res, {
      authorizationParams: { audience },
    });

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
