import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  paydunyaConfigured,
  softpayOrangeMoneySenegal,
  softpayPhoneSn,
  softpayWaveSenegal,
} from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"
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

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      adherent: true,
      contribution: true,
    },
  })

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
  }
  if (payment.status === "completed") {
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      status: "completed",
    })
  }
  if (!payment.token) {
    return NextResponse.json(
      { error: "Facture PayDunya absente — recréez le paiement" },
      { status: 400 }
    )
  }

  const nameFromAdherent = payment.adherent
    ? `${payment.adherent.prenoms} ${payment.adherent.nom}`.trim()
    : ""
  const nameFromContribution = payment.contribution
    ? `${payment.contribution.prenoms || ""} ${payment.contribution.nom || ""}`.trim()
    : ""
  const fullName =
    nameFromAdherent ||
    nameFromContribution ||
    payment.customerName ||
    "Client Ahloul Khidmah"

  const email =
    payment.adherent?.email || payment.contribution?.email || ""

  const phone =
    softpayPhoneSn(phoneOverride) ||
    softpayPhoneSn(payment.adherent?.whatsapp) ||
    softpayPhoneSn(payment.adherent?.tel) ||
    softpayPhoneSn(payment.contribution?.tel) ||
    softpayPhoneSn(payment.customerPhone)

  if (phone.length < 9) {
    return NextResponse.json(
      { error: "Numéro de téléphone requis pour SoftPay" },
      { status: 400 }
    )
  }

  try {
    const result =
      method === "wave"
        ? await softpayWaveSenegal({
            token: payment.token,
            fullName,
            email: email || undefined,
            phone,
          })
        : await softpayOrangeMoneySenegal({
            token: payment.token,
            customerName: fullName,
            email: email || undefined,
            phone,
          })

    return NextResponse.json({
      ok: true,
      method,
      paymentId: payment.id,
      message: result.message,
      url: result.url,
      omUrl: result.omUrl,
      maxitUrl: result.maxitUrl,
      qrDataUrl: result.qrDataUrl,
      fees: result.fees,
      currency: result.currency,
    })
  } catch (err) {
    console.error("SoftPay error", err)
    // Sandbox / clés test : SoftPay opérateur indisponible → checkout classique
    if (payment.checkoutUrl) {
      return NextResponse.json({
        ok: true,
        fallback: true,
        paymentId: payment.id,
        method,
        message:
          process.env.NODE_ENV === "production"
            ? "SoftPay indisponible — paiement classique"
            : err instanceof Error
              ? err.message
              : "SoftPay indisponible — paiement classique",
        url: payment.checkoutUrl,
      })
    }
    const message =
      process.env.NODE_ENV === "production"
        ? "Erreur SoftPay"
        : err instanceof Error
          ? err.message
          : "Erreur SoftPay"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
