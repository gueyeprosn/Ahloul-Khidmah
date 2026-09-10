import { adhesionLightSchema, type AdhesionLightValues } from "@/features/adherents/schema"
import {
  createAdherentFromForm,
  createAdherentWithMemberNumber,
  findAdherentIdByPhone,
  findOrCreateCellule,
} from "@/lib/adherents"
import { parseMontantFcfa } from "@/lib/adherents-shared"
import { generateAdhesionId } from "@/lib/adhesion-id"
import { prisma } from "@/lib/db"
import { assertCompletePhone } from "@/lib/phone-validate"
import {
  createCheckoutInvoice,
  currentPeriode,
  paydunyaConfigured,
} from "@/lib/paydunya"

const PLACEHOLDER = "À préciser"

export type AdhesionPreview = {
  nom: string
  prenoms: string
  tel: string
  montant: string
  montantAutre?: string
}

export function parseAdhesionDraft(
  raw: string | null | undefined
): AdhesionLightValues | null {
  if (!raw) return null
  try {
    return adhesionLightSchema.parse(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Démarre un paiement d'adhésion sans créer l'adhérent en base. */
export async function startAdhesionCheckoutFromDraft(raw: unknown) {
  if (!paydunyaConfigured()) {
    throw new Error("PayDunya non configuré")
  }

  const draft = adhesionLightSchema.parse(raw)
  const tel = assertCompletePhone(draft.tel)
  draft.tel = tel
  const amount = parseMontantFcfa(draft.montant, draft.montantAutre)
  if (!amount || amount < 100) {
    throw new Error("Montant invalide pour le paiement")
  }

  const fullName = `${draft.prenoms} ${draft.nom}`.trim()
  const periode = currentPeriode()

  const payment = await prisma.payment.create({
    data: {
      type: "adhesion",
      periode,
      amount,
      status: "pending",
      customerName: fullName,
      customerPhone: tel,
      adhesionDraft: JSON.stringify(draft),
    },
  })

  const invoice = await createCheckoutInvoice({
    amount,
    description: `Adhésion Ahloul Khidmah — ${fullName}`,
    paymentId: payment.id,
    type: "adhesion",
    periode,
    customer: {
      name: fullName,
      phone: tel,
    },
  })

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      token: invoice.token,
      checkoutUrl: invoice.url,
    },
  })
}

/** Crée l'adhérent à partir du brouillon stocké sur le paiement (idempotent). */
export async function ensureAdherentFromAdhesionPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.type !== "adhesion") {
    throw new Error("Paiement adhésion introuvable")
  }
  if (payment.adherentId) {
    return payment.adherentId
  }

  const draft = parseAdhesionDraft(payment.adhesionDraft)
  if (!draft) {
    throw new Error("Brouillon adhésion manquant")
  }

  const adherent = await createAdherentFromForm(draft, {
    mode: "light",
    status: "actif",
    allowCreateCellule: true,
  })

  // Rattachement atomique : si un appel concurrent (ex. deux notifications
  // PayDunya pour le même paiement) a déjà créé et rattaché son propre
  // adhérent entre-temps, cette mise à jour ne touche aucune ligne (la
  // condition adherentId: null n'est plus vraie) — on le détecte via
  // count === 0 plutôt que de laisser deux fiches membre coexister pour
  // la même personne.
  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, adherentId: null },
    data: { adherentId: adherent.id },
  })

  if (claimed.count === 0) {
    await prisma.adherent.delete({ where: { id: adherent.id } })
    const settled = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!settled?.adherentId) {
      throw new Error("Rattachement de l'adhérent au paiement incohérent")
    }
    return settled.adherentId
  }

  return adherent.id
}

/**
 * Si le don porte un numéro de téléphone (donc pas anonyme — un don
 * anonyme a déjà tel=null en base, voir createContributionCheckout),
 * rattache ou crée l'adhérent correspondant : un don avec téléphone
 * devient une adhésion, sans cotisation mensuelle exigée ensuite (marqué
 * canal: "don", exclu du suivi des cotisations — voir /cotisations).
 * Retourne null sans erreur si aucune fiche ne doit être créée : le
 * paiement lui-même a déjà réussi, ce n'est jamais bloquant.
 */
export async function ensureAdherentFromContribution(
  paymentId: string
): Promise<string | null> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment || payment.type !== "don" || !payment.contributionId) {
    return null
  }
  if (payment.adherentId) return payment.adherentId

  const contribution = await prisma.contribution.findUnique({
    where: { id: payment.contributionId },
  })
  if (!contribution?.tel?.trim()) return null

  let tel: string
  try {
    tel = assertCompletePhone(contribution.tel)
  } catch {
    return null
  }

  const existingId = await findAdherentIdByPhone(tel)
  if (existingId) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { adherentId: existingId },
    })
    return existingId
  }

  const cellule = await findOrCreateCellule(PLACEHOLDER, PLACEHOLDER)
  const id = generateAdhesionId()
  const adherent = await createAdherentWithMemberNumber({
    id,
    numAdhesion: id,
    dateEntree: new Date().toISOString().slice(0, 10),
    celluleLocale: PLACEHOLDER,
    zoneRegion: PLACEHOLDER,
    nom: contribution.nom?.trim() || PLACEHOLDER,
    prenoms: contribution.prenoms?.trim() || PLACEHOLDER,
    dateNaissance: PLACEHOLDER,
    lieuNaissance: null,
    cni: PLACEHOLDER,
    nationalite: PLACEHOLDER,
    adresse: PLACEHOLDER,
    tel,
    whatsapp: tel,
    email: contribution.email?.trim() || null,
    profession: PLACEHOLDER,
    domaines: "[]",
    autreProfession: null,
    montant: "0",
    montantAutre: null,
    canal: "don",
    status: "actif",
    ficheComplete: false,
    celluleId: cellule.id,
  })

  // Même rattachement atomique que ensureAdherentFromAdhesionPayment : si
  // un appel concurrent a déjà créé et rattaché son propre adhérent pour
  // ce même paiement entre-temps, on supprime notre doublon et on
  // retourne celui déjà attaché.
  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, adherentId: null },
    data: { adherentId: adherent.id },
  })
  if (claimed.count === 0) {
    await prisma.adherent.delete({ where: { id: adherent.id } })
    const settled = await prisma.payment.findUnique({ where: { id: paymentId } })
    return settled?.adherentId ?? null
  }

  return adherent.id
}

export function draftToPreview(draft: AdhesionLightValues): AdhesionPreview {
  return {
    nom: draft.nom,
    prenoms: draft.prenoms,
    tel: draft.tel,
    montant: draft.montant,
    montantAutre: draft.montantAutre,
  }
}
