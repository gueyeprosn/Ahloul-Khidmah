import { prisma } from "@/lib/db"
import {
  confirmCheckoutInvoice,
  createCheckoutInvoice,
  currentPeriode,
  paydunyaConfigured,
} from "@/lib/paydunya"
import { parseMontantFcfa } from "@/lib/adherents-shared"
import {
  ensureAdherentFromAdhesionPayment,
  ensureAdherentFromContribution,
} from "@/lib/adhesion-checkout"
import { labelPeriode, shiftPeriode } from "@/lib/periode"
import { walletCredit } from "@/lib/wallet"

/** Périodes couvertes par un paiement cotisation — `periodes` (multi-mois) sinon `periode` seul. */
function paymentPeriodes(payment: {
  periode: string | null
  periodes: string | null
}) {
  if (payment.periodes) {
    try {
      const parsed = JSON.parse(payment.periodes) as unknown
      if (
        Array.isArray(parsed) &&
        parsed.length &&
        parsed.every((p) => typeof p === "string")
      ) {
        return parsed as string[]
      }
    } catch {
      // brouillon corrompu — repli sur `periode`
    }
  }
  return [payment.periode || currentPeriode()]
}

/**
 * Les `count` périodes impayées les plus récentes pour un adhérent
 * (remonte mois par mois depuis la période courante), triées chronologiquement.
 * Permet à un adhérent en retard de régler plusieurs mois en un seul paiement.
 */
export async function resolveUnpaidPeriodes(adherentId: string, count: number) {
  const n = Math.min(Math.max(Math.trunc(count) || 1, 1), 12)
  const paid = await prisma.cotisation.findMany({
    where: { adherentId, statut: "paye" },
    select: { periode: true },
  })
  const paidSet = new Set(paid.map((c) => c.periode))
  const periodes: string[] = []
  let cursor = currentPeriode()
  for (let i = 0; periodes.length < n && i < 36; i++) {
    if (!paidSet.has(cursor)) periodes.push(cursor)
    cursor = shiftPeriode(cursor, -1)
  }
  return periodes.sort()
}

export async function markCotisationPaid(opts: {
  adherentId: string
  periode: string
  amount: number
  canal?: string
  note?: string
}) {
  const existing = await prisma.cotisation.findUnique({
    where: {
      adherentId_periode: {
        adherentId: opts.adherentId,
        periode: opts.periode,
      },
    },
  })

  const cotisation = await prisma.cotisation.upsert({
    where: {
      adherentId_periode: {
        adherentId: opts.adherentId,
        periode: opts.periode,
      },
    },
    update: {
      montant: opts.amount,
      canal: opts.canal || "paydunya",
      statut: "paye",
      paidAt: new Date(),
      note: opts.note,
    },
    create: {
      adherentId: opts.adherentId,
      periode: opts.periode,
      montant: opts.amount,
      canal: opts.canal || "paydunya",
      statut: "paye",
      paidAt: new Date(),
      note: opts.note,
    },
  })

  // Crédite le wallet uniquement au passage à "payé" — évite un double
  // crédit si cette période était déjà marquée payée (simple correction).
  if (existing?.statut !== "paye") {
    await walletCredit({
      adherentId: opts.adherentId,
      amount: opts.amount,
      label: `Cotisation ${labelPeriode(opts.periode)}`,
      reference: `cotisation:${cotisation.id}`,
    })
  }

  return cotisation
}

export async function completePaymentByToken(token: string) {
  const confirmed = await confirmCheckoutInvoice(token)
  if (confirmed.status !== "completed") {
    return { ok: false as const, status: confirmed.status, payment: null }
  }

  const payment = await prisma.payment.findFirst({
    where: { token },
  })
  if (!payment) {
    return { ok: false as const, status: "unknown_payment", payment: null }
  }

  // Un paiement "completed" sans adhérent rattaché (type adhesion) est resté
  // bloqué lors d'une tentative précédente (ex. collision de numéro de
  // membre) : on ne sort pas ici, on retente la création plus bas plutôt que
  // de considérer ce paiement comme définitivement traité sans jamais créer
  // la fiche membre correspondante.
  if (
    payment.status === "completed" &&
    (payment.type !== "adhesion" || payment.adherentId)
  ) {
    return { ok: true as const, status: "completed", payment }
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "completed",
      receiptUrl: confirmed.receiptUrl || null,
      customerName: confirmed.customerName || null,
      customerPhone: confirmed.customerPhone || null,
      rawPayload: JSON.stringify(confirmed.raw),
    },
  })

  if (payment.type === "don" && payment.contributionId) {
    await prisma.contribution.update({
      where: { id: payment.contributionId },
      data: { status: "completed" },
    })
    // Un don avec téléphone (donc pas anonyme) devient une adhésion, sans
    // cotisation mensuelle exigée — voir ensureAdherentFromContribution.
    // Ne fait jamais échouer la confirmation du don si ça échoue : le don
    // lui-même a déjà réussi.
    try {
      await ensureAdherentFromContribution(payment.id)
    } catch (e) {
      console.error("ensureAdherentFromContribution", e)
    }
  } else if (payment.type === "adhesion") {
    const adherentId =
      payment.adherentId ||
      (await ensureAdherentFromAdhesionPayment(payment.id))

    const periode = payment.periode || currentPeriode()
    await markCotisationPaid({
      adherentId,
      periode,
      amount: payment.amount,
      canal: "paydunya",
      note: `PayDunya ${token}`,
    })

    await prisma.adherent.update({
      where: { id: adherentId },
      data: { status: "actif" },
    })

    const { queueAdherentBadgeNotify } = await import(
      "@/lib/send-member-badge"
    )
    queueAdherentBadgeNotify(adherentId)

    const updatedWithAdherent = await prisma.payment.update({
      where: { id: payment.id },
      data: { adherentId },
    })
    return { ok: true as const, status: "completed", payment: updatedWithAdherent }
  } else if (payment.adherentId) {
    const periodes = paymentPeriodes(payment)
    const perAmount =
      periodes.length > 1
        ? Math.round(payment.amount / periodes.length)
        : payment.amount
    for (const periode of periodes) {
      await markCotisationPaid({
        adherentId: payment.adherentId,
        periode,
        amount: perAmount,
        canal: "paydunya",
        note: `PayDunya ${token}`,
      })
    }
  }

  return { ok: true as const, status: "completed", payment: updated }
}

export async function startPaydunyaCheckout(opts: {
  adherentId: string
  type: "adhesion" | "cotisation"
  periode?: string
  /** Cotisation multi-mois : plusieurs périodes réglées en un seul paiement. */
  periodes?: string[]
}) {
  if (!paydunyaConfigured()) {
    throw new Error(
      "PayDunya non configuré — renseignez PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN"
    )
  }

  const adherent = await prisma.adherent.findUnique({
    where: { id: opts.adherentId },
  })
  if (!adherent) throw new Error("Adhérent introuvable")

  const unitAmount = parseMontantFcfa(adherent.montant, adherent.montantAutre)
  if (!unitAmount || unitAmount < 100) {
    throw new Error("Montant invalide pour le paiement")
  }

  const periode = opts.periode || currentPeriode()
  const periodes =
    opts.type === "cotisation" && opts.periodes && opts.periodes.length
      ? [...new Set(opts.periodes)].sort()
      : [periode]
  const amount =
    opts.type === "cotisation" ? unitAmount * periodes.length : unitAmount

  const description =
    opts.type === "adhesion"
      ? `Adhésion Ahloul Khidmah — ${adherent.prenoms} ${adherent.nom}`
      : periodes.length > 1
        ? `Cotisations ${periodes.map(labelPeriode).join(", ")} — ${adherent.prenoms} ${adherent.nom}`
        : `Cotisation ${periode} — ${adherent.prenoms} ${adherent.nom}`

  const payment = await prisma.payment.create({
    data: {
      adherentId: adherent.id,
      type: opts.type,
      periode: periodes[0],
      periodes: opts.type === "cotisation" ? JSON.stringify(periodes) : null,
      amount,
      status: "pending",
    },
  })

  const invoice = await createCheckoutInvoice({
    amount,
    description,
    paymentId: payment.id,
    adherentId: adherent.id,
    type: opts.type,
    periode: periodes[0],
    customer: {
      name: `${adherent.prenoms} ${adherent.nom}`.trim(),
      email: adherent.email || undefined,
      phone: adherent.whatsapp || adherent.tel,
    },
  })

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      token: invoice.token,
      checkoutUrl: invoice.url,
    },
  })

  return updated
}
