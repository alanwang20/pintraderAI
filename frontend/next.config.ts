import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ebayimg.com",
      },
      {
        protocol: "https",
        hostname: "**.ebay.com",
      },
    ],
  },
};

export default nextConfig;
