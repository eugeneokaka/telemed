import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  eslint: {
    // This will allow the build to succeed even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
