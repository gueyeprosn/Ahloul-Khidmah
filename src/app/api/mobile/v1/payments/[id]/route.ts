import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { paymentPeriodes, completePaymentByToken } from "@/lib/payments"
import { rateLimitPersistent } from "@/lib/rate-limit-persistent"
import { mobileError, rateLimited } from "@/lib/mobile/http"
import { authenticateMobile } from "@/lib/mobile/session"

/**
 * Statut d'un paiement du membre connecté. Tant qu'il est « pending », le
 * serveur interroge PayDunya (confirmation serveur à serveur) : le statut
 * renvoyé est celui de la base, jamais une déclaration du téléphone.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobile(request)
  if (!auth) return mobileError("unauthorized", "Non connecté.", 401)

  const limit = await rateLimitPersistent(`m-pay-status:${auth.adherentId}`, 240, 15 * 60 * 1000)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const { id } = await context.params
  const select = {
    id: true, adherentId: true, status: true, amount: true, type: true,
    token: true, receiptUrl: true, periode: true, periodes: true,
  } as const
  let payment = await prisma.payment.findUnique({ where: { id: String(id).slice(0, 64) }, select })
  // Paiement d'un autre membre = introuvable (pas de sondage d'identifiants).
  if (!payment || payment.adherentId !== auth.adherentId) {
    return mobileError("not_found", "Paiement introuvable.", 404)
  }

  if (payment.status === "pending" && payment.token) {
    try {
      await completePaymentByToken(payment.token)
      payment = (await prisma.payment.findUnique({ where: { id: payment.id }, select })) ?? payment
    } catch {
      /* PayDunya injoignable : on renvoie l'état connu, le client réessaiera */
    }
  }

  return NextResponse.json({
    id: payment.id,
    status: payment.status, // pending | completed | canceled | failed
    amount: payment.amount,
    type: payment.type,
    periodes: paymentPeriodes(payment),
    receiptUrl: payment.status === "completed" ? payment.receiptUrl : null,
  })
}
