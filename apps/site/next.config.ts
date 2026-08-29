import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Shared render code lives in apps/web/src — allow tracing/compiling it.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
