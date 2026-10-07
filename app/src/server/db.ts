import { PrismaClient } from "@prisma/client";

// On Vercel + Neon, POSTGRES_PRISMA_URL is the pooled URL with pgbouncer=true (required for
// Prisma behind PgBouncer: no prepared statement clashes). Locally DATABASE_URL is used.
const datasourceUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient({ datasourceUrl });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
