import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { completePaymentByToken } from "@/lib/payments"
import { completeStoreOrderByToken } from "@/lib/store/checkout"
import { verifyPaydunyaHash } from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/**
 * IPN PayDunya — POST application/x-www-form-urlencoded
 * Le payload est sous la clé "data" (JSON stringifié).
 */
export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`pay-ipn:${ip}`, 60, 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json({ error: "rate" }, { status: 429 })
  }

  try {
    const contentType = request.headers.get("content-type") || ""
    let rawData: unknown

    if (contentType.includes("application/json")) {
      const json = await request.json()
      rawData = json.data ?? json
    } else {
      const form = await request.formData()
      const dataField = form.get("data")
      if (typeof dataField === "string") {
        rawData = JSON.parse(dataField)
      } else {
        rawData = Object.fromEntries(form.entries())
      }
    }

    const payload =
      typeof rawData === "string"
        ? (JSON.parse(rawData) as Record<string, unknown>)
        : (rawData as Record<string, unknown>)

    const hash = String(payload.hash || "")
    if (!verifyPaydunyaHash(hash)) {
      console.error("PayDunya IPN: hash invalide")
      return NextResponse.json({ error: "hash invalide" }, { status: 403 })
    }

    const status = String(payload.status || "").toLowerCase()
    const custom = (payload.custom_data || {}) as Record<string, string>
    const paymentId = custom.payment_id
    const orderId = custom.order_id
    const invoiceObj = payload.invoice as { token?: string } | undefined
    const invoiceToken = String(
      invoiceObj?.token || payload.token || ""
    ).trim()

    let mappedStatus: "completed" | "canceled" | "failed" | "pending" =
      "pending"
    if (status === "completed") mappedStatus = "completed"
    else if (status === "cancelled" || status === "canceled")
      mappedStatus = "canceled"
    else if (status === "failed") mappedStatus = "failed"

    // Commande boutique : logique séparée (modèle Order, pas Payment).
    if (orderId) {
      if (invoiceToken) {
        await prisma.order.updateMany({
          where: { id: orderId },
          data: { paymentToken: invoiceToken },
        })
        await completeStoreOrderByToken(invoiceToken)
      }
      return NextResponse.json({ ok: true })
    }

    if (paymentId) {
      await prisma.payment.updateMany({
        where: { id: paymentId },
        data: {
          ...(invoiceToken ? { token: invoiceToken } : {}),
          rawPayload: JSON.stringify(payload),
          status: mappedStatus,
        },
      })
    }

    if (mappedStatus === "completed" && invoiceToken) {
      await completePaymentByToken(invoiceToken)
    } else if (mappedStatus === "completed" && paymentId) {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      })
      if (payment?.token) {
        await completePaymentByToken(payment.token)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("PayDunya IPN error", e)
    return NextResponse.json({ error: "ipn error" }, { status: 500 })
  }
}
