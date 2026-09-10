import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { completePaymentByToken } from "@/lib/payments"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(request)
  const limited = rateLimit(`pay-status:${ip}`, 60, 5 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  const { id } = await context.params
  const paymentId = String(id || "").slice(0, 64)
  if (!paymentId) {
    return NextResponse.json({ error: "id requis" }, { status: 400 })
  }

  let payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      status: true,
      amount: true,
      type: true,
      token: true,
      receiptUrl: true,
    },
  })

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })
  }

  // Relance confirm si encore pending (IPN parfois lent)
  if (payment.status === "pending" && payment.token) {
    try {
      const result = await completePaymentByToken(payment.token)
      if (result.payment) {
        payment = {
          id: result.payment.id,
          status: result.payment.status,
          amount: result.payment.amount,
          type: result.payment.type,
          token: result.payment.token,
          receiptUrl: result.payment.receiptUrl,
        }
      }
    } catch {
      /* ignore — poll suivant */
    }
  }

  return NextResponse.json({
    ok: true,
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    type: payment.type,
    receiptUrl: payment.receiptUrl,
  })
}
