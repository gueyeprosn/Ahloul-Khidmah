import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { parseMontantFcfa } from "@/lib/adherents-shared"
import { paydunyaConfigured } from "@/lib/paydunya"
import { resolveUnpaidPeriodes } from "@/lib/payments"
import { mobileError } from "@/lib/mobile/http"
import { authenticateMobile } from "@/lib/mobile/session"

/** Nombre maximal de mois réglables en un seul paiement (règle du site). */
export const MAX_MONTHS = 6

/**
 * Cotisations dues du membre connecté : les mois impayés **les plus récents**
 * en remontant depuis le mois courant (jamais des mois à l'avance), et le
 * montant mensuel. Le client choisit combien de mois régler, du plus récent au
 * plus ancien ; le serveur recalcule tout à la création du paiement.
 */
export async function GET(request: Request) {
  const auth = await authenticateMobile(request)
  if (!auth) return mobileError("unauthorized", "Non connecté.", 401)

  const adherent = await prisma.adherent.findUnique({ where: { id: auth.adherentId } })
  if (!adherent) return mobileError("not_found", "Dossier introuvable.", 404)

  const unitAmount = parseMontantFcfa(adherent.montant, adherent.montantAutre) ?? 0
  const periodes = await resolveUnpaidPeriodes(adherent.id, MAX_MONTHS)

  return NextResponse.json({
    paymentsEnabled: paydunyaConfigured() && adherent.status !== "archive" && unitAmount >= 100,
    unitAmount,
    maxMonths: MAX_MONTHS,
    // Du plus ancien au plus récent ; le client en retient les N plus récents.
    periods: periodes.map((periode) => ({ periode, amount: unitAmount })),
  })
}
