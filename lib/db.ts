// Shared Prisma client instance. Prisma 7 requires a driver adapter to be
// passed in; for local Postgres we use @prisma/adapter-pg.
//
// In Next.js dev mode the module is re-evaluated on every hot reload, which
// would create a new connection pool each time. We cache the client on
// globalThis to avoid that.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Check your .env file.");
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
