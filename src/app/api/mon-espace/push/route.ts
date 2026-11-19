import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getMemberSession } from "@/lib/member-auth"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { notifyDevice } from "@/lib/push"
import { WELCOME_ROUTE, WELCOME_WEB_PATH, welcomeNotification } from "@/lib/welcome-notification"

const tokenSchema = z.object({ token: z.string().min(10).max(4096) })
const registerSchema = tokenSchema.extend({ locale: z.enum(["fr", "ar"]).optional() })

/**
 * Enregistre le jeton push du navigateur (PWA) du membre connecté. Réservé à
 * une session membre : un visiteur ne peut pas enregistrer de jeton web.
 */
export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  const limited = rateLimit(`web-push:${clientIp(request)}`, 30, 15 * 60 * 1000)
  if (!limited.ok) return NextResponse.json({ error: "Trop de demandes" }, { status: 429 })

  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  const { token, locale } = parsed.data

  const before = await prisma.deviceToken.findUnique({
    where: { token },
    select: { adherentId: true },
  })
  await prisma.deviceToken.upsert({
    where: { token },
    create: { token, platform: "web", locale, adherentId: session.adherentId },
    update: { platform: "web", locale, adherentId: session.adherentId, lastSeenAt: new Date() },
  })
  // Première liaison de cet appareil à ce membre : notification de bienvenue
  // (nom, n° de badge, « touchez pour voir votre badge »). Preuve immédiate que
  // ça marche. Pas pour un simple rafraîchissement.
  if (before?.adherentId !== session.adherentId) {
    const member = await prisma.adherent.findUnique({
      where: { id: session.adherentId },
      select: { id: true, prenoms: true, nom: true },
    })
    if (member) {
      void notifyDevice(token, locale, welcomeNotification(member), {
        route: WELCOME_ROUTE,
        webPath: WELCOME_WEB_PATH,
      })
    }
  }
  return NextResponse.json({ ok: true })
}

/** Désactive les notifications de ce navigateur (uniquement ses propres jetons). */
export async function DELETE(request: Request) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  const parsed = tokenSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  await prisma.deviceToken.deleteMany({
    where: { token: parsed.data.token, adherentId: session.adherentId },
  })
  return NextResponse.json({ ok: true })
}
