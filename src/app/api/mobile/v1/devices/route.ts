import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { clientIp } from "@/lib/rate-limit"
import { rateLimitPersistent } from "@/lib/rate-limit-persistent"
import { mobileError, rateLimited, readJson } from "@/lib/mobile/http"
import { authenticateMobile } from "@/lib/mobile/session"

const registerSchema = z.object({
  token: z.string().min(10).max(4096),
  platform: z.enum(["android", "ios"]),
  locale: z.enum(["fr", "ar"]).optional(),
  appVersion: z.string().trim().max(32).optional(),
})

/**
 * Enregistre/rafraîchit le jeton push de l'appareil. Authentification
 * optionnelle : sans session valide le jeton est enregistré SANS compte
 * (annonces générales seulement) ; avec session il est rattaché au membre.
 */
export async function POST(request: Request) {
  const limit = await rateLimitPersistent(`m-device-ip:${clientIp(request)}`, 60, 15 * 60 * 1000)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const parsed = registerSchema.safeParse(await readJson(request))
  if (!parsed.success) return mobileError("invalid_request", "Requête invalide.", 400)

  const auth = await authenticateMobile(request)
  const { token, platform, locale, appVersion } = parsed.data
  await prisma.deviceToken.upsert({
    where: { token },
    create: { token, platform, locale, appVersion, adherentId: auth?.adherentId ?? null },
    update: {
      platform,
      locale,
      appVersion,
      lastSeenAt: new Date(),
      adherentId: auth?.adherentId ?? null,
    },
  })
  return NextResponse.json({ ok: true })
}

const deleteSchema = z.object({ token: z.string().min(10).max(4096) })

/** Supprime le jeton (désactivation des notifications, jeton invalide). */
export async function DELETE(request: Request) {
  const parsed = deleteSchema.safeParse(await readJson(request))
  if (!parsed.success) return mobileError("invalid_request", "Requête invalide.", 400)
  await prisma.deviceToken.deleteMany({ where: { token: parsed.data.token } })
  return NextResponse.json({ ok: true })
}
