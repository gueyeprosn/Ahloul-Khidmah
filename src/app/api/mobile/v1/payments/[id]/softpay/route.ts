import { NextResponse } from "next/server"
import { z } from "zod"
import { paydunyaConfigured } from "@/lib/paydunya"
import { rateLimitPersistent } from "@/lib/rate-limit-persistent"
import { startSoftpay } from "@/lib/softpay-start"
import { mobileError, rateLimited, readJson } from "@/lib/mobile/http"
import { authenticateMobile } from "@/lib/mobile/session"

const bodySchema = z.object({
  method: z.enum(["wave", "orange"]),
  phone: z.string().trim().max(32).optional(),
})

/**
 * Lance Wave ou Orange Money (SoftPay) sur un paiement du membre connecté.
 * Si SoftPay est indisponible (mode test PayDunya, panne opérateur), répond
 * `fallback: true` avec la page de paiement classique (carte comprise).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobile(request)
  if (!auth) return mobileError("unauthorized", "Non connecté.", 401)

  const parsed = bodySchema.safeParse(await readJson(request))
  if (!parsed.success) return mobileError("invalid_request", "Moyen de paiement invalide.", 400)
  if (!paydunyaConfigured()) {
    return mobileError("payments_unavailable", "Le paiement en ligne n'est pas disponible pour le moment.", 503)
  }

  const limit = await rateLimitPersistent(`m-pay-softpay:${auth.adherentId}`, 15, 15 * 60 * 1000)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const { id } = await context.params
  const outcome = await startSoftpay({
    paymentId: String(id).slice(0, 64),
    method: parsed.data.method,
    phone: parsed.data.phone,
    onlyForAdherentId: auth.adherentId,
  })

  switch (outcome.kind) {
    case "not_found":
      return mobileError("not_found", "Paiement introuvable.", 404)
    case "already_paid":
      return NextResponse.json({ status: "completed", alreadyPaid: true })
    case "no_invoice":
      return mobileError("no_invoice", "Facture absente : recommencez le paiement.", 409)
    case "phone_required":
      return mobileError("phone_required", "Numéro de téléphone requis.", 400)
    case "ok":
      return NextResponse.json({
        mode: "softpay",
        method: outcome.method,
        message: outcome.message,
        url: outcome.url ?? null,
        omUrl: outcome.omUrl ?? null,
        maxitUrl: outcome.maxitUrl ?? null,
        fees: outcome.fees ?? null,
      })
    case "fallback":
      return NextResponse.json({ mode: "hosted", message: outcome.message, url: outcome.url })
    case "error":
      return mobileError("softpay_error", "Le moyen de paiement choisi est indisponible.", 502)
  }
}
