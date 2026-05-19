import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.70.70.50"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
