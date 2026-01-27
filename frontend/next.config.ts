const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://api:8080";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/clothes/:path*",
        destination: `${API_BASE_URL}/api/clothes/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${API_BASE_URL}/api/users/:path*`,
      },
      {
        source: "/api/ai/:path*",
        destination: `${API_BASE_URL}/api/ai/:path*`,
      },
      {
        source: "/api/aiStylist/:path*",
        destination: `${API_BASE_URL}/api/aiStylist/:path*`,
      },
    ];
  },
};

export default nextConfig;
