import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer uses canvas/node internals — exclude from server bundle
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;