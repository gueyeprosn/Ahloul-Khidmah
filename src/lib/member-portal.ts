import { z } from "zod"
import { formatMontantLabel } from "@/lib/adhesion-id"
import { prisma } from "@/lib/db"
import { memberIdSuffix } from "@/lib/member-access"
import { verifyMemberPin } from "@/lib/member-pin"
import { labelPeriode } from "@/lib/periode"
import { phonesMatch } from "@/lib/whatsapp-shared"
import {
  getWalletBalance,
  getWalletTransactions,
  serializeWalletTransaction,
} from "@/lib/wallet"

export const memberLoginSchema = z.object({
  tel: z.string().trim().min(8).max(32),
  // Selon le compte : le code PIN choisi par le membre (4 chiffres) s'il en
  // a défini un, sinon les 4 derniers caractères de son N° membre. Le
  // serveur détermine lequel s'applique — voir findAdherentByTelAndCode.
  suffix: z
    .string()
    .trim()
    .min(4)
    .max(4)
    .regex(/^[A-Za-z0-9]{4}$/, "4 caractères requis"),
})

export const memberProfileUpdateSchema = z.object({
  nom: z.string().trim().min(2).max(80),
  prenoms: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().max(32).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(160)
    .email("Email invalide")
    .optional()
    .or(z.literal("")),
  profession: z.string().trim().min(2).max(120),
  autreProfession: z.string().trim().max(500).optional().or(z.literal("")),
})

const adherentSelect = {
  id: true,
  nom: true,
  prenoms: true,
  tel: true,
  whatsapp: true,
  email: true,
  profession: true,
  autreProfession: true,
  celluleLocale: true,
  zoneRegion: true,
  montant: true,
  montantAutre: true,
  status: true,
  ficheComplete: true,
  dateEntree: true,
  createdAt: true,
  memberNumber: true,
  photoUrl: true,
  sessionVersion: true,
} as const

const cotisationsSelect = {
  orderBy: { periode: "desc" as const },
  take: 24,
  select: {
    periode: true,
    montant: true,
    statut: true,
    canal: true,
    paidAt: true,
  },
}

/**
 * Recherche adhérent par téléphone + code d'accès.
 * Le code accepté est :
 * - les 4 derniers caractères du N° membre (toujours, badge), OU
 * - le PIN à 4 chiffres s'il a été défini.
 * Le téléphone est comparé de façon souple (indicatif, troncature).
 */
export async function findAdherentByTelAndCode(tel: string, codeRaw: string) {
  const code = codeRaw.trim()
  const codeUpper = code.toUpperCase()
  const candidates = await prisma.adherent.findMany({
    select: {
      ...adherentSelect,
      pinHash: true,
      cotisations: cotisationsSelect,
    },
  })

  const phoneMatches = candidates.filter(
    (a) =>
      phonesMatch(a.tel, tel) ||
      (a.whatsapp ? phonesMatch(a.whatsapp, tel) : false)
  )

  if (phoneMatches.length === 0) return null

  // Dès qu'un membre a défini un PIN personnel, le suffixe d'ID (non
  // secret — envoyé en clair par WhatsApp/email, voir memberAccessLines)
  // cesse d'être une méthode d'accès valide : sinon un PIN "fort" resterait
  // contournable indéfiniment par la même porte faible (audit sécurité 2026).
  const accepted: typeof phoneMatches = []
  for (const adherent of phoneMatches) {
    if (adherent.pinHash) {
      if (/^\d{4}$/.test(code) && (await verifyMemberPin(code, adherent.pinHash))) {
        accepted.push(adherent)
      }
      continue
    }
    if (memberIdSuffix(adherent.id) === codeUpper) {
      accepted.push(adherent)
    }
  }

  return accepted.length === 1 ? accepted[0] : null
}

export async function getAdherentForMemberSession(adherentId: string) {
  return prisma.adherent.findUnique({
    where: { id: adherentId },
    select: {
      ...adherentSelect,
      pinHash: true,
      cotisations: cotisationsSelect,
    },
  })
}

export async function serializeMemberPortal(
  adherent: NonNullable<Awaited<ReturnType<typeof getAdherentForMemberSession>>>
) {
  const [walletBalance, walletTransactions] = await Promise.all([
    getWalletBalance(adherent.id),
    getWalletTransactions(adherent.id, 24),
  ])

  return {
    id: adherent.id,
    name: `${adherent.prenoms} ${adherent.nom}`.trim(),
    suffix: memberIdSuffix(adherent.id),
    // N'expose jamais le hash lui-même — seulement s'il existe.
    hasPin: Boolean(adherent.pinHash),
    nom: adherent.nom,
    prenoms: adherent.prenoms,
    tel: adherent.tel,
    whatsapp: adherent.whatsapp || "",
    email: adherent.email || "",
    profession:
      adherent.profession === "À préciser" ? "" : adherent.profession,
    autreProfession: adherent.autreProfession || "",
    celluleLocale: adherent.celluleLocale,
    zoneRegion: adherent.zoneRegion,
    status: adherent.status,
    ficheComplete: adherent.ficheComplete,
    dateEntree: adherent.dateEntree,
    memberNumber: adherent.memberNumber,
    photoUrl: adherent.photoUrl,
    cotisationPrevue: formatMontantLabel(
      adherent.montant,
      adherent.montantAutre || undefined
    ),
    versements: adherent.cotisations.map((c) => ({
      periode: c.periode,
      periodeLabel: labelPeriode(c.periode),
      montant: c.montant,
      statut: c.statut,
      canal: c.canal,
      paidAt: c.paidAt?.toISOString() ?? null,
    })),
    walletBalance,
    walletTransactions: walletTransactions.map(serializeWalletTransaction),
  }
}
