import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

// A single shared Prisma client. In dev with hot-reload (tsx watch), stash it
// on globalThis so repeated reloads don't open a new connection pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
