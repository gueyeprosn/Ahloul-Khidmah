import { NextResponse } from "next/server"
import { paydunyaConfigured } from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { startSoftpay } from "@/lib/softpay-start"
import { softpaySchema } from "@/features/payments/schema"

export async function POST(request: Request) {
  if (!paydunyaConfigured()) {
    return NextResponse.json(
      { error: "PayDunya n'est pas configuré" },
      { status: 503 }
    )
  }

  const ip = clientIp(request)
  const limited = rateLimit(`pay-softpay:${ip}`, 30, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  const body = await request.json()
  const parsed = softpaySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { paymentId, method } = parsed.data
  const phoneOverride = parsed.data.phone || ""

  const outcome = await startSoftpay({ paymentId, method, phone: phoneOverride })
  const isProd = process.env.NODE_ENV === "production"

  switch (outcome.kind) {
    case "not_found":
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
    case "already_paid":
      return NextResponse.json({ ok: true, alreadyPaid: true, status: "completed" })
    case "no_invoice":
      return NextResponse.json(
        { error: "Facture PayDunya absente — recréez le paiement" },
        { status: 400 }
      )
    case "phone_required":
      return NextResponse.json(
        { error: "Numéro de téléphone requis pour SoftPay" },
        { status: 400 }
      )
    case "ok":
      return NextResponse.json({
        ok: true,
        method: outcome.method,
        paymentId: outcome.paymentId,
        message: outcome.message,
        url: outcome.url,
        omUrl: outcome.omUrl,
        maxitUrl: outcome.maxitUrl,
        qrDataUrl: outcome.qrDataUrl,
        fees: outcome.fees,
        currency: outcome.currency,
      })
    case "fallback":
      // Sandbox / clés test : SoftPay opérateur indisponible → checkout classique
      return NextResponse.json({
        ok: true,
        fallback: true,
        paymentId: outcome.paymentId,
        method: outcome.method,
        message: isProd ? outcome.message : outcome.detail,
        url: outcome.url,
      })
    case "error":
      return NextResponse.json(
        { error: isProd ? "Erreur SoftPay" : outcome.detail },
        { status: 500 }
      )
  }
}
