import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { startPaydunyaCheckout } from "@/lib/payments"
import { paydunyaConfigured } from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { checkoutSchema } from "@/features/payments/schema"

export async function POST(request: Request) {
  if (!paydunyaConfigured()) {
    return NextResponse.json(
      {
        error:
          "PayDunya n'est pas encore configuré. Ajoutez les clés API dans .env.",
      },
      { status: 503 }
    )
  }

  const ip = clientIp(request)
  const limited = rateLimit(`pay-checkout:${ip}`, 20, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  try {
    const body = await request.json()
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { adherentId, type, periode } = parsed.data

    const session = await getSession()
    const adherent = await prisma.adherent.findUnique({
      where: { id: adherentId },
    })
    if (!adherent) {
      return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 })
    }

    // Public : uniquement pour sa propre adhésion récente (en_attente) ou admin
    if (!session) {
      if (adherent.status === "archive") {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
      }
      // Limite : adhésion créée il y a < 48h pour éviter abus
      const ageMs = Date.now() - adherent.createdAt.getTime()
      if (type === "adhesion" && ageMs > 48 * 60 * 60 * 1000) {
        return NextResponse.json(
          { error: "Délai de paiement adhésion expiré — contactez l'admin" },
          { status: 403 }
        )
      }
      if (type === "cotisation" && !session) {
        // Cotisation publique autorisée si adhérent actif (lien partagé)
        if (adherent.status !== "actif" && adherent.status !== "en_attente") {
          return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
        }
      }
    }

    const payment = await startPaydunyaCheckout({
      adherentId,
      type,
      periode,
    })

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      url: payment.checkoutUrl,
      token: payment.token,
      amount: payment.amount,
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
