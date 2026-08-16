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
  images: {
    // CloudFront / CDN hosts for object-storage derivatives.
    // Data URLs and /samples remain unoptimized at the component level.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.almaari.app",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.almaari.app" }],
        destination: "https://almaari.app/:path*",
        permanent: true,
      },
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/home/",
        destination: "/",
        permanent: true,
      },
    ];
  },
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
