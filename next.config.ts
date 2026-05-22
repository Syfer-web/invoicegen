import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling react-pdf in server builds
  // react-pdf uses canvas/pixelman which fail during server-side static analysis
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
};

export default nextConfig;