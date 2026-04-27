import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/adapter-better-sqlite3", "pg", "better-sqlite3"],
};

export default nextConfig;
