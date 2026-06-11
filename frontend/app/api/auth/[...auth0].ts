import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
import { syncUserOnLogin } from "../../../lib/syncUserBootstrap";

export default handleAuth({
  callback: handleCallback({
    async afterCallback(_req, _res, session) {
      try {
        const auth0Id = session?.user?.sub;
        const email = session?.user?.email;
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://api:8080";

        if (auth0Id && email) {
          await syncUserOnLogin(API_BASE_URL, auth0Id, email);
        }
      } catch (err) {
        console.error("Post-auth user bootstrap failed:", err);
      }
      return session;
    },
  }),
});
