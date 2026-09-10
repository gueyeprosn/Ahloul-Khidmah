import { NextResponse } from "next/server"
import {
  createMemberSessionToken,
  MEMBER_COOKIE,
  memberCookieOptions,
} from "@/lib/member-auth"
import {
  getAdherentForMemberSession,
  serializeMemberPortal,
} from "@/lib/member-portal"
import { prisma } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/**
 * Après un paiement d'adhésion / cotisation / don (avec téléphone) réussi :
 * ouvre la session mon-espace sans resaisir téléphone + code (paymentId
 * non devinable).
 */
export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`mon-espace-claim:${ip}`, 12, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    )
  }

  let paymentId = ""
  try {
    const body = (await request.json()) as { paymentId?: string }
    paymentId = String(body.paymentId || "").trim()
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  if (!paymentId || paymentId.length > 64) {
    return NextResponse.json({ error: "Paiement invalide" }, { status: 400 })
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      status: true,
      type: true,
      adherentId: true,
    },
  })

  if (!payment || payment.status !== "completed" || !payment.adherentId) {
    return NextResponse.json(
      { error: "Paiement non confirmé ou sans dossier membre." },
      { status: 403 }
    )
  }

  // Un don avec adherentId a été rattaché à un membre (téléphone renseigné,
  // voir ensureAdherentFromContribution) — ouvre l'espace membre comme une
  // adhésion. Un don sans adherentId (anonyme/sans téléphone) est déjà
  // rejeté par la vérification !payment.adherentId ci-dessus.
  const adherent = await getAdherentForMemberSession(payment.adherentId)
  if (!adherent) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })
  }

  const portal = await serializeMemberPortal(adherent)
  const token = await createMemberSessionToken(
    { adherentId: adherent.id, name: portal.name },
    adherent.sessionVersion
  )

  const res = NextResponse.json({
    ok: true,
    member: portal,
    redirect: "/mon-espace",
  })
  res.cookies.set(MEMBER_COOKIE, token, memberCookieOptions())
  return res
}
