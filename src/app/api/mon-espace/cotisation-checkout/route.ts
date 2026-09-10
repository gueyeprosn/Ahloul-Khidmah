import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getMemberSession } from "@/lib/member-auth"
import { paydunyaConfigured } from "@/lib/paydunya"
import { resolveUnpaidPeriodes, startPaydunyaCheckout } from "@/lib/payments"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  if (!paydunyaConfigured()) {
    return NextResponse.json(
      { error: "Paiement en ligne non configuré" },
      { status: 503 }
    )
  }

  const ip = clientIp(request)
  const limited = rateLimit(`mon-espace-cotisation:${ip}`, 10, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  const adherent = await prisma.adherent.findUnique({
    where: { id: session.adherentId },
  })
  if (!adherent) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
  }
  if (adherent.status === "archive") {
    return NextResponse.json(
      { error: "Compte archivé — contactez l'administration." },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const monthsCountRaw = Number(body.monthsCount)
  const monthsCount = Number.isFinite(monthsCountRaw)
    ? Math.min(Math.max(Math.trunc(monthsCountRaw), 1), 6)
    : 1

  try {
    const periodes = await resolveUnpaidPeriodes(adherent.id, monthsCount)
    const payment = await startPaydunyaCheckout({
      adherentId: adherent.id,
      type: "cotisation",
      periodes,
    })

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      url: payment.checkoutUrl,
      amount: payment.amount,
      periodes,
    })
  } catch (e) {
    console.error(e)
    const message =
      process.env.NODE_ENV === "production"
        ? "Erreur paiement"
        : e instanceof Error
          ? e.message
          : "Erreur paiement"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
