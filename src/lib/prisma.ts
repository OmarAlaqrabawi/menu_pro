import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;

  // Production: PostgreSQL via @prisma/adapter-pg
  if (dbUrl?.startsWith("postgresql")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");
    // Append sslmode if not present
    const connStr = dbUrl.includes("sslmode") ? dbUrl : `${dbUrl}?sslmode=require`;
    const adapter = new PrismaPg({ connectionString: connStr });
    return new PrismaClient({ adapter });
  }

  // Local dev: SQLite via better-sqlite3
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
    return new PrismaClient({ adapter });
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");
    const connStr = dbUrl?.includes("sslmode") ? dbUrl : `${dbUrl}?sslmode=require`;
    const adapter = new PrismaPg({ connectionString: connStr });
    return new PrismaClient({ adapter });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
