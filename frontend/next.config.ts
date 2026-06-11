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
      {
        source: "/api/feedback/:path*",
        destination: `${API_BASE_URL}/api/feedback/:path*`,
      },
      {
        source: "/api/billing/:path*",
        destination: `${API_BASE_URL}/api/billing/:path*`,
      },
      {
        source: "/api/weather/:path*",
        destination: `${API_BASE_URL}/api/weather/:path*`,
      },
      {
        source: "/api/users/role",
        destination: `${API_BASE_URL}/api/users/role`,
      },
    ];
  },
};

export default nextConfig;
