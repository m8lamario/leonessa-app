import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  allowedDevOrigins: ['192.168.1.5']
};

export default nextConfig;
