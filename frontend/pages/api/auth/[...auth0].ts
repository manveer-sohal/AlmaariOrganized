import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";

export default handleAuth({
  callback: handleCallback({
    async afterCallback(req, res, session) {
      try {
        const auth0Id = session?.user?.sub;
        const email = session?.user?.email;
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://api:8080";
        if (auth0Id) {
          await fetch(`${apiBaseUrl}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auth0Id, email }),
          });
        }
      } catch (err) {
        console.error("Post-auth user bootstrap failed:", err);
        // Intentionally ignore errors here to not block login/signup
      }
      return session;
    },
  }),
});
