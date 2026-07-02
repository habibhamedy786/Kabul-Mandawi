import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

// Use WebSockets so Prisma connects to Neon over port 443 (not 5432).
// This works in local dev, Vercel, and any environment where port 5432 is blocked.
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
