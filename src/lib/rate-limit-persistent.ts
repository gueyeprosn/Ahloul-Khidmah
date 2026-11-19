import { prisma } from "@/lib/db"

/**
 * Limiteur de débit PERSISTANT (table RateLimitBucket) : contrairement à
 * lib/rate-limit.ts (en mémoire, remis à zéro à chaque redémarrage PM2), il
 * résiste aux redémarrages — nécessaire pour protéger des codes à 4 chiffres
 * exposés à une application publique.
 *
 * Une seule instruction SQL atomique (upsert + RETURNING) : pas de course
 * lecture/écriture même sous SQLite mono-écrivain.
 */
export async function rateLimitPersistent(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const now = Date.now()
  const rows = await prisma.$queryRaw<{ count: number; resetAt: bigint }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${now + windowMs})
    ON CONFLICT("key") DO UPDATE SET
      "count"   = CASE WHEN "resetAt" <= ${now} THEN 1 ELSE "count" + 1 END,
      "resetAt" = CASE WHEN "resetAt" <= ${now} THEN ${now + windowMs} ELSE "resetAt" END
    RETURNING "count", "resetAt"`

  const row = rows[0]
  // Nettoyage occasionnel des compteurs expirés (évite la croissance infinie).
  if (Math.random() < 0.01) {
    void prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" <= ${now}`.catch(
      () => {}
    )
  }
  if (!row) return { ok: true }
  if (Number(row.count) > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((Number(row.resetAt) - now) / 1000)),
    }
  }
  return { ok: true }
}

/** Remet un compteur à zéro (ex. après une connexion réussie). */
export async function rateLimitReset(key: string) {
  await prisma.rateLimitBucket.deleteMany({ where: { key } })
}
