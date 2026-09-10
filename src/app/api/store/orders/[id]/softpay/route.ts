import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import {
  paydunyaConfigured,
  softpayOrangeMoneySenegal,
  softpayPhoneSn,
  softpayWaveSenegal,
} from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"

const bodySchema = z.object({
  method: z.enum(["wave", "orange"], { message: "Méthode invalide (wave | orange)" }),
  phone: z.string().trim().max(32).optional(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!paydunyaConfigured()) {
    return NextResponse.json({ error: "PayDunya n'est pas configuré" }, { status: 503 })
  }

  const ip = clientIp(request)
  const limited = rateLimit(`store-softpay:${ip}`, 30, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  const { id } = await context.params
  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { method } = parsed.data
  const phoneOverride = parsed.data.phone || ""

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ ok: true, alreadyPaid: true, status: "completed" })
  }
  if (!order.paymentToken) {
    return NextResponse.json(
      { error: "Facture PayDunya absente — recréez la commande" },
      { status: 400 }
    )
  }

  const phone =
    softpayPhoneSn(phoneOverride) || softpayPhoneSn(order.customerPhone)
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
            token: order.paymentToken,
            fullName: order.customerName,
            email: order.customerEmail || undefined,
            phone,
          })
        : await softpayOrangeMoneySenegal({
            token: order.paymentToken,
            customerName: order.customerName,
            email: order.customerEmail || undefined,
            phone,
          })

    return NextResponse.json({
      ok: true,
      method,
      paymentId: order.id,
      message: result.message,
      url: result.url,
      omUrl: result.omUrl,
      maxitUrl: result.maxitUrl,
      qrDataUrl: result.qrDataUrl,
      fees: result.fees,
      currency: result.currency,
    })
  } catch (err) {
    console.error("Store SoftPay error", err)
    if (order.checkoutUrl) {
      return NextResponse.json({
        ok: true,
        fallback: true,
        paymentId: order.id,
        method,
        message:
          process.env.NODE_ENV === "production"
            ? "SoftPay indisponible — paiement classique"
            : err instanceof Error
              ? err.message
              : "SoftPay indisponible — paiement classique",
        url: order.checkoutUrl,
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
