const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://api:8080";

// Backend API segments proxied to Cloud Run. `/api/auth/*` stays on Next.js
// (Auth0 + access-token). On Vercel, each proxied prefix must appear here —
// unlisted `/api/*` paths 404 at the edge before reaching the backend.
const BACKEND_API_SEGMENTS = [
  "clothes",
  "users",
  "ai",
  "aiStylist",
  "ai-stylist",
  "feedback",
  "billing",
  "weather",
].join("|");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: `/api/:segment(${BACKEND_API_SEGMENTS})/:path*`,
          destination: `${API_BASE_URL}/api/:segment/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
