import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logAudit } from "@/lib/audit-log"
import { rateLimit } from "@/lib/rate-limit"
import { pushConfigured, safeMobileRoute, sendPush } from "@/lib/push"

const bodySchema = z.object({
  title: z.string().trim().min(2).max(60),
  body: z.string().trim().min(2).max(240),
  route: z.string().trim().max(64).optional().or(z.literal("")),
  webPath: z.string().trim().max(120).optional().or(z.literal("")),
  /** « all » = tous les appareils ; sinon l'identifiant d'un adhérent. */
  audience: z.union([z.literal("all"), z.object({ adherentId: z.string().min(5).max(64) })]),
})

/** État : service configuré et nombre d'appareils enregistrés. */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  const [total, members, byPlatform] = await Promise.all([
    prisma.deviceToken.count(),
    prisma.deviceToken.count({ where: { adherentId: { not: null } } }),
    prisma.deviceToken.groupBy({ by: ["platform"], _count: true }),
  ])
  return NextResponse.json({
    configured: pushConfigured(),
    devices: { total, members, byPlatform: Object.fromEntries(byPlatform.map((p) => [p.platform, p._count])) },
  })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const limited = rateLimit(`push-send:${session.id}`, 10, 60 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop d'envois. Réessayez plus tard." }, { status: 429 })
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Notifications non configurées sur le serveur." }, { status: 503 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 })
  }
  const { title, body, route, webPath, audience } = parsed.data
  if (route && !safeMobileRoute(route)) {
    return NextResponse.json({ error: "Destination mobile non autorisée." }, { status: 400 })
  }

  try {
    const result = await sendPush({
      title,
      body,
      route: route || null,
      webPath: webPath || null,
      audience: audience === "all" ? { kind: "all" } : { kind: "member", adherentId: audience.adherentId },
    })
    await logAudit(
      { id: session.id, name: session.name },
      "push.send",
      "push",
      null,
      `« ${title} » → ${audience === "all" ? "tous" : audience.adherentId} : ${result.sent}/${result.targeted} envoyé(s), ${result.removed} jeton(s) retiré(s)`
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error("push send failed", e)
    return NextResponse.json({ error: "Envoi impossible." }, { status: 502 })
  }
}
