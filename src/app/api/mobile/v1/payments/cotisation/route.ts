import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { parseMontantFcfa } from "@/lib/adherents-shared"
import { paydunyaConfigured, PaydunyaUnavailableError } from "@/lib/paydunya"
import { resolveUnpaidPeriodes, startPaydunyaCheckout } from "@/lib/payments"
import { rateLimitPersistent } from "@/lib/rate-limit-persistent"
import { mobileError, rateLimited, readJson } from "@/lib/mobile/http"
import { authenticateMobile } from "@/lib/mobile/session"
import { MAX_MONTHS } from "../due/route"

const bodySchema = z.object({
  monthsCount: z.number().int().min(1).max(MAX_MONTHS),
})

/**
 * Crée un paiement de cotisation (facture PayDunya) pour le membre connecté.
 * Le paiement reste « pending » : **seul le serveur** le passe à « completed »
 * après confirmation du prestataire. Cette route ne marque jamais rien payé.
 */
export async function POST(request: Request) {
  const auth = await authenticateMobile(request)
  if (!auth) return mobileError("unauthorized", "Non connecté.", 401)

  const parsed = bodySchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return mobileError("invalid_request", `Choisissez de 1 à ${MAX_MONTHS} mois.`, 400)
  }

  if (!paydunyaConfigured()) {
    return mobileError("payments_unavailable", "Le paiement en ligne n'est pas disponible pour le moment.", 503)
  }

  const limit = await rateLimitPersistent(`m-pay-create:${auth.adherentId}`, 10, 15 * 60 * 1000)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const adherent = await prisma.adherent.findUnique({ where: { id: auth.adherentId } })
  if (!adherent) return mobileError("not_found", "Dossier introuvable.", 404)
  if (adherent.status === "archive") {
    return mobileError("account_archived", "Compte archivé : contactez l'administration.", 403)
  }
  const unit = parseMontantFcfa(adherent.montant, adherent.montantAutre)
  if (!unit || unit < 100) {
    return mobileError("invalid_amount", "Montant de cotisation invalide : contactez l'administration.", 422)
  }

  try {
    const periodes = await resolveUnpaidPeriodes(adherent.id, parsed.data.monthsCount)
    if (periodes.length === 0) {
      return mobileError("nothing_due", "Aucune cotisation à régler.", 409)
    }
    const payment = await startPaydunyaCheckout({
      adherentId: adherent.id,
      type: "cotisation",
      periodes,
    })
    return NextResponse.json({
      paymentId: payment.id,
      amount: payment.amount,
      periodes,
      checkoutUrl: payment.checkoutUrl,
    })
  } catch (e) {
    if (e instanceof PaydunyaUnavailableError) {
      console.error(e.message)
      return mobileError("payments_unavailable", "Le paiement en ligne n'est pas disponible pour le moment.", 503)
    }
    console.error(e)
    return mobileError("payment_error", "Erreur lors de la création du paiement.", 500)
  }
}
