import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["inbox.pairashopeai.online"],
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
