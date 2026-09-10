import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  sqliteReady?: Promise<void>
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

/** WAL + busy_timeout : mieux en lecture concurrente / pics d’adhésion. */
async function ensureSqlitePragmas() {
  try {
    // journal_mode / busy_timeout renvoient une ligne → queryRaw
    await prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;")
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout=5000;")
    await prisma.$executeRawUnsafe("PRAGMA synchronous=NORMAL;")
    await prisma.$executeRawUnsafe("PRAGMA temp_store=MEMORY;")
    await prisma.$executeRawUnsafe("PRAGMA cache_size=-64000;")
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON;")
  } catch {
    /* ignore si non-SQLite ou DB absente au build */
  }
}

if (!globalForPrisma.sqliteReady) {
  globalForPrisma.sqliteReady = ensureSqlitePragmas()
}

export const sqliteReady = globalForPrisma.sqliteReady

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
