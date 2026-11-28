import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is missing. Please set it in your .env file."
    );
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });
  return new PrismaClient({ adapter });
}

// Invalidate stale in-memory client if new models (such as reviewReport) were generated
const isStale = Boolean(
  globalForPrisma.prisma && !("reviewReport" in globalForPrisma.prisma)
);

export const prisma =
  !globalForPrisma.prisma || isStale
    ? (globalForPrisma.prisma = createPrismaClient())
    : globalForPrisma.prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
