import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { completePaymentByToken } from "@/lib/payments"
import { completeStoreOrderByToken } from "@/lib/store/checkout"
import { diagnoseIpnHash, verifyPaydunyaHash } from "@/lib/paydunya"
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
      const badInvoice = payload.invoice as { token?: string } | undefined
      const badToken = String(badInvoice?.token || payload.token || "").trim()
      console.error(
        "PayDunya IPN: hash invalide",
        JSON.stringify({ ...diagnoseIpnHash(hash, badToken), keys: Object.keys(payload).slice(0, 12) })
      )

      // Le contenu de cette notification n'est PAS fiable : on n'en retient
      // que le jeton de facture, et seulement pour le faire CONFIRMER
      // directement auprès de PayDunya (serveur à serveur, clés privées).
      // Sans cela, un membre qui paie puis ferme son navigateur avant le
      // retour sur le site resterait « en attente » alors qu'il a payé.
      // Rien du payload (statut, données) n'est écrit en base.
      const limitedBad = rateLimit(`pay-ipn-bad:${ip}`, 20, 60 * 1000)
      if (badToken && limitedBad.ok) {
        const known = await prisma.payment.findFirst({
          where: { token: badToken },
          select: { id: true },
        })
        if (known) {
          try {
            const r = await completePaymentByToken(badToken)
            if (r.ok) return NextResponse.json({ ok: true, confirmed: true })
          } catch (e) {
            console.error("PayDunya IPN (hash invalide) : confirmation impossible", e)
          }
        }
      }
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
          // « completed » n'est JAMAIS écrit ici : seul completePaymentByToken
          // le pose, après confirmation serveur à serveur auprès de PayDunya,
          // et déclenche en même temps les effets métier (cotisation payée,
          // don validé…). Écrire « completed » d'abord faisait sortir
          // completePaymentByToken prématurément pour les types cotisation/don
          // (audit mobile S5, test tests/lib/ipn-cotisation.test.ts).
          ...(mappedStatus !== "completed" ? { status: mappedStatus } : {}),
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
