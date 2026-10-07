import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets several dev servers run side by side (NEXT_DIST_DIR=.next-foo next dev -p 3101).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
