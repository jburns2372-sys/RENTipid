import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['applicationinsights', 'diagnostic-channel-publishers'],
};

export default nextConfig;
