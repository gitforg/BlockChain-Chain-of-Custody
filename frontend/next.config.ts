import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.56.1", "localhost:3000", "127.0.0.1:3000"],
};

export default nextConfig;
