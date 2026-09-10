import { Prisma } from "@prisma/client"
import {
  adhesionAdminSchema,
  adhesionAdminUpdateSchema,
  adhesionCompleteSchema,
  adhesionLightSchema,
} from "@/features/adherents/schema"
import { generateAdhesionId } from "@/lib/adhesion-id"
import { prisma } from "@/lib/db"
import { assertCompletePhone } from "@/lib/phone-validate"
import { normalizeWaPhone, phonesMatch } from "@/lib/whatsapp-shared"

export {
  parseMontantFcfa,
  canalLabel,
  statusLabel,
} from "@/lib/adherents-shared"

const PLACEHOLDER = "À préciser"

type CreateOptions = {
  status?: "actif" | "en_attente"
  allowCreateCellule?: boolean
  mode?: "light" | "full" | "admin"
}

/**
 * Prochain numéro d'ordre séquentiel (1 = premier membre inscrit). Calculé
 * au moment de la création — le rang, pas un ID technique — voir
 * scripts/backfill-member-number pour l'attribution aux membres existants.
 */
async function nextMemberNumber() {
  const agg = await prisma.adherent.aggregate({
    _max: { memberNumber: true },
  })
  return (agg._max.memberNumber ?? 0) + 1
}

/**
 * Crée l'adhérent en attribuant un memberNumber au dernier moment, avec
 * nouvelle tentative en cas de collision. nextMemberNumber() lit le plus
 * grand numéro puis fait +1 sans verrou : si deux inscriptions arrivent en
 * même temps (ex. un paiement en ligne confirmé pendant qu'un admin inscrit
 * quelqu'un manuellement), les deux peuvent calculer le même numéro — la
 * seconde création échoue alors avec une erreur d'unicité. On recalcule et
 * on réessaie plutôt que de laisser cette erreur remonter (et faire échouer
 * l'inscription, ou pire : bloquer un paiement déjà encaissé sans jamais
 * créer la fiche membre correspondante).
 */
export async function createAdherentWithMemberNumber(
  data: Omit<Prisma.AdherentUncheckedCreateInput, "memberNumber">
) {
  const MAX_ATTEMPTS = 20
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const memberNumber = await nextMemberNumber()
    try {
      return await prisma.adherent.create({ data: { ...data, memberNumber } })
    } catch (e) {
      const isMemberNumberConflict =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        String(e.meta?.target ?? "").includes("memberNumber")
      if (!isMemberNumberConflict || attempt === MAX_ATTEMPTS) throw e
      // Petite pause aléatoire pour désynchroniser les inscriptions
      // simultanées avant de recalculer un nouveau numéro.
      await new Promise((r) => setTimeout(r, 10 + Math.random() * 30))
    }
  }
  throw new Error("Impossible d'attribuer un numéro de membre")
}

/**
 * Cherche une cellule par nom, la crée si absente. Même souci que
 * nextMemberNumber() : si deux inscriptions créent la même cellule en même
 * temps (ex. les toutes premières adhésions "À préciser" simultanées), la
 * seconde création échoue sur l'unicité du nom — on relit alors la cellule
 * créée par l'autre requête au lieu de laisser planter l'inscription.
 */
export async function findOrCreateCellule(name: string, zone: string) {
  const existing = await prisma.cellule.findFirst({
    where: { name: { equals: name } },
  })
  if (existing) return existing
  try {
    return await prisma.cellule.create({ data: { name, zone } })
  } catch (e) {
    const isNameConflict =
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002" &&
      String(e.meta?.target ?? "").includes("name")
    if (!isNameConflict) throw e
    const created = await prisma.cellule.findFirst({
      where: { name: { equals: name } },
    })
    if (created) return created
    throw e
  }
}

async function assertUniqueAdherentTel(tel: string, excludeId?: string) {
  const normalized = normalizeWaPhone(tel)
  const digits = tel.replace(/\D/g, "")
  const local9 = digits.length >= 9 ? digits.slice(-9) : digits

  const candidates = await prisma.adherent.findMany({
    where: {
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      OR: [
        { tel: { contains: local9 } },
        { whatsapp: { contains: local9 } },
        normalized ? { tel: { contains: normalized } } : {},
        normalized ? { whatsapp: { contains: normalized } } : {},
      ],
    },
    select: { id: true, tel: true, whatsapp: true },
    take: 20,
  })

  const conflict = candidates.find(
    (a) => phonesMatch(a.tel, tel) || (a.whatsapp ? phonesMatch(a.whatsapp, tel) : false)
  )
  if (conflict) throw new Error("DUPLICATE_PHONE")
}

/**
 * Recherche floue d'un adhérent existant par téléphone (même logique que
 * assertUniqueAdherentTel, mais retourne l'id au lieu de lever une erreur —
 * pour "trouver ou créer" plutôt que "rejeter le doublon").
 */
export async function findAdherentIdByPhone(
  tel: string
): Promise<string | null> {
  const normalized = normalizeWaPhone(tel)
  const digits = tel.replace(/\D/g, "")
  const local9 = digits.length >= 9 ? digits.slice(-9) : digits

  const candidates = await prisma.adherent.findMany({
    where: {
      OR: [
        { tel: { contains: local9 } },
        { whatsapp: { contains: local9 } },
        normalized ? { tel: { contains: normalized } } : {},
        normalized ? { whatsapp: { contains: normalized } } : {},
      ],
    },
    select: { id: true, tel: true, whatsapp: true },
    take: 20,
  })

  const match = candidates.find(
    (a) => phonesMatch(a.tel, tel) || (a.whatsapp ? phonesMatch(a.whatsapp, tel) : false)
  )
  return match?.id ?? null
}

export async function createAdherentFromForm(
  raw: unknown,
  opts: CreateOptions = {}
) {
  const mode = opts.mode ?? "full"
  const status = opts.status ?? "en_attente"
  const id = generateAdhesionId()

  if (mode === "light") {
    const data = adhesionLightSchema.parse(raw)
    const paysRegion = data.paysRegion.trim()
    const celluleName = PLACEHOLDER
    const tel = assertCompletePhone(data.tel)

    await assertUniqueAdherentTel(tel)

    const cellule = await findOrCreateCellule(celluleName, paysRegion.slice(0, 120))

    return createAdherentWithMemberNumber({
      id,
      numAdhesion: id,
      dateEntree: new Date().toISOString().slice(0, 10),
      celluleLocale: celluleName,
      zoneRegion: paysRegion,
      nom: data.nom.trim(),
      prenoms: data.prenoms.trim(),
      dateNaissance: PLACEHOLDER,
      lieuNaissance: null,
      cni: PLACEHOLDER,
      nationalite: PLACEHOLDER,
      adresse: PLACEHOLDER,
      tel,
      whatsapp: tel,
      email: null,
      profession: PLACEHOLDER,
      domaines: "[]",
      autreProfession: null,
      montant: data.montant,
      montantAutre: data.montantAutre?.trim() || null,
      canal: "paydunya",
      status,
      ficheComplete: false,
      celluleId: cellule.id,
    })
  }

  // Mode admin (ou legacy "full") : fiche allégée, N° toujours auto
  const data = adhesionAdminSchema.parse(raw)
  const celluleName = data.celluleLocale.trim()
  const tel = assertCompletePhone(data.tel)
  const whatsapp = data.whatsapp?.trim()
    ? assertCompletePhone(data.whatsapp)
    : tel
  await assertUniqueAdherentTel(tel)
  const cellule = await findOrCreateCellule(
    celluleName,
    data.zoneRegion.trim().slice(0, 120)
  )

  const profession = data.profession?.trim() || PLACEHOLDER

  return createAdherentWithMemberNumber({
    id,
    numAdhesion: id,
    dateEntree: new Date().toISOString().slice(0, 10),
    celluleLocale: celluleName,
    zoneRegion: data.zoneRegion.trim(),
    nom: data.nom.trim(),
    prenoms: data.prenoms.trim(),
    dateNaissance: PLACEHOLDER,
    lieuNaissance: null,
    cni: PLACEHOLDER,
    nationalite: PLACEHOLDER,
    adresse: PLACEHOLDER,
    tel,
    whatsapp,
    email: data.email?.trim() || null,
    profession,
    domaines: "[]",
    autreProfession: null,
    montant: data.montant,
    montantAutre: data.montantAutre?.trim() || null,
    canal: "cellule",
    status,
    ficheComplete: false,
    celluleId: cellule.id,
  })
}

export async function completeAdherentProfile(
  id: string,
  raw: unknown,
  opts?: { skipTelCheck?: boolean }
) {
  const data = adhesionCompleteSchema.parse(raw)
  const adherent = await prisma.adherent.findUnique({ where: { id } })
  if (!adherent) throw new Error("NOT_FOUND")

  // Accepte +22177… et 77… (même numéro)
  if (!opts?.skipTelCheck && !phonesMatch(adherent.tel, data.tel)) {
    throw new Error("TEL_MISMATCH")
  }

  const tel = assertCompletePhone(data.tel)
  const whatsapp = data.whatsapp?.trim()
    ? assertCompletePhone(data.whatsapp)
    : tel
  await assertUniqueAdherentTel(tel, id)

  return prisma.adherent.update({
    where: { id },
    data: {
      nom: data.nom.trim(),
      prenoms: data.prenoms.trim(),
      tel,
      whatsapp,
      email: data.email?.trim() || null,
      profession: data.profession.trim(),
      autreProfession: data.autreProfession?.trim() || null,
      ficheComplete: true,
    },
  })
}

/** Mise à jour admin — corrige les erreurs de saisie (tél., nom, cellule…). */
export async function updateAdherentByAdmin(id: string, raw: unknown) {
  const data = adhesionAdminUpdateSchema.parse(raw)
  const adherent = await prisma.adherent.findUnique({ where: { id } })
  if (!adherent) throw new Error("NOT_FOUND")

  const tel = assertCompletePhone(data.tel)
  const whatsapp = data.whatsapp?.trim()
    ? assertCompletePhone(data.whatsapp)
    : tel
  await assertUniqueAdherentTel(tel, id)

  const celluleName = data.celluleLocale.trim()
  const cellule = await findOrCreateCellule(
    celluleName,
    data.zoneRegion.trim().slice(0, 120)
  )

  const profession = data.profession?.trim() || PLACEHOLDER
  const ficheComplete =
    adherent.ficheComplete ||
    (profession !== PLACEHOLDER && data.nom.trim().length >= 2)

  return prisma.adherent.update({
    where: { id },
    data: {
      nom: data.nom.trim(),
      prenoms: data.prenoms.trim(),
      tel,
      whatsapp,
      email: data.email?.trim() || null,
      profession,
      autreProfession: data.autreProfession?.trim() || null,
      celluleLocale: celluleName,
      zoneRegion: data.zoneRegion.trim(),
      montant: data.montant,
      montantAutre:
        data.montant === "autre" ? data.montantAutre?.trim() || null : null,
      celluleId: cellule.id,
      ficheComplete,
    },
  })
}

export function adherentToTicket(adherent: {
  id: string
  nom: string
  prenoms: string
  celluleLocale: string
  zoneRegion: string
  profession: string
  montant: string
  montantAutre: string | null
  canal: string
  tel: string
  createdAt: Date
}) {
  return {
    id: adherent.id,
    nom: adherent.nom,
    prenoms: adherent.prenoms,
    celluleLocale: adherent.celluleLocale,
    zoneRegion: adherent.zoneRegion,
    profession: adherent.profession,
    montant:
      adherent.montant === "autre"
        ? adherent.montantAutre || "autre"
        : adherent.montant,
    canal: adherent.canal,
    tel: adherent.tel,
    createdAt: adherent.createdAt.toISOString(),
  }
}
