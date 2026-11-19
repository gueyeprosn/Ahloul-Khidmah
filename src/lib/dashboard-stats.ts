import { prisma } from "@/lib/db"
import { parseMontantFcfa } from "@/lib/adherents-shared"
import { classifyZone } from "@/lib/geo"

const DAY_MS = 24 * 60 * 60 * 1000

function periodeOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Indicateurs de pilotage financier (recouvrement, retards, conversion des
 * paiements, dons par campagne, boutique). Tout est calculé à la volée sur la
 * base : aucune donnée n'est inventée, un indicateur sans base de calcul
 * vaut 0 et la page décide de l'afficher ou non.
 */
export async function getPilotageStats(now: Date, historyMonths: number) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const historyStart = new Date(
    now.getFullYear(),
    now.getMonth() - (historyMonths - 1),
    1
  )
  const since30 = new Date(now.getTime() - 30 * DAY_MS)
  const periode = periodeOf(now)
  const periodePrec = periodeOf(prevMonthStart)

  const [
    cotisants,
    payeesPeriode,
    payeesPrec,
    paiements30,
    donsParCampagne,
    donsCampagneMois,
    boutiqueMois,
    adhesionsHistorique,
    actifsGeo,
  ] = await Promise.all([
    // Membres dont une cotisation mensuelle est attendue (hors canal "don").
    prisma.adherent.findMany({
      where: { status: "actif", canal: { not: "don" } },
      select: { id: true, montant: true, montantAutre: true, createdAt: true },
    }),
    prisma.cotisation.findMany({
      where: { periode, statut: "paye" },
      select: { adherentId: true, montant: true },
    }),
    prisma.cotisation.findMany({
      where: { periode: periodePrec, statut: "paye" },
      select: { adherentId: true },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.contribution.groupBy({
      by: ["campagne"],
      where: { status: "completed" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.contribution.groupBy({
      by: ["campagne"],
      where: { status: "completed", updatedAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.adherent.findMany({
      where: { createdAt: { gte: historyStart } },
      select: { createdAt: true },
    }),
    prisma.adherent.findMany({
      where: { status: "actif" },
      select: { zoneRegion: true, celluleLocale: true },
    }),
  ])

  // --- Qualité / répartition géographique des membres actifs ----------------
  const geo = { senegal: 0, diaspora: 0, inconnu: 0 }
  let celluleAPreciser = 0
  for (const a of actifsGeo) {
    geo[classifyZone(a.zoneRegion)] += 1
    const cellule = a.celluleLocale.trim().toLowerCase()
    if (!cellule || cellule === "à préciser") celluleAPreciser += 1
  }

  // --- Recouvrement de la période en cours ---------------------------------
  const payeSet = new Set(payeesPeriode.map((c) => c.adherentId))
  const payePrecSet = new Set(payeesPrec.map((c) => c.adherentId))

  let attendu = 0
  let impayes = 0
  let montantImpayes = 0
  let retard2 = 0
  let montantRetard2 = 0
  for (const a of cotisants) {
    const engagement = parseMontantFcfa(a.montant, a.montantAutre)
    attendu += engagement
    if (payeSet.has(a.id)) continue
    impayes += 1
    montantImpayes += engagement
    // En retard de 2 mois : rien de payé le mois dernier non plus, et le
    // membre existait déjà alors (un nouvel adhérent n'est pas "en retard").
    if (!payePrecSet.has(a.id) && a.createdAt < prevMonthStart) {
      retard2 += 1
      montantRetard2 += engagement
    }
  }
  const encaisseePeriode = payeesPeriode.reduce((s, c) => s + c.montant, 0)
  const tauxRecouvrement =
    attendu > 0 ? Math.round((encaisseePeriode / attendu) * 100) : 0
  const cotisationMoyenne =
    payeesPeriode.length > 0
      ? Math.round(encaisseePeriode / payeesPeriode.length)
      : 0

  // --- Conversion des paiements (30 derniers jours) -------------------------
  const byStatus = new Map(
    paiements30.map((p) => [p.status, p._count._all] as const)
  )
  const reussis = byStatus.get("completed") ?? 0
  const initiés = paiements30.reduce((s, p) => s + p._count._all, 0)
  const tauxConversion =
    initiés > 0 ? Math.round((reussis / initiés) * 100) : 0

  // --- Dons par campagne ----------------------------------------------------
  const moisParCampagne = new Map(
    donsCampagneMois.map((d) => [d.campagne, d._sum.amount ?? 0] as const)
  )
  const campagnes = donsParCampagne
    .map((d) => ({
      campagne: d.campagne,
      total: d._sum.amount ?? 0,
      nombre: d._count._all,
      ceMois: moisParCampagne.get(d.campagne) ?? 0,
    }))
    .sort((a, b) => b.total - a.total)

  // --- Nouvelles adhésions par mois (alignées sur l'historique) -------------
  const adhesionsParMois = Array.from({ length: historyMonths }, () => 0)
  for (const a of adhesionsHistorique) {
    const diff =
      (a.createdAt.getFullYear() - historyStart.getFullYear()) * 12 +
      (a.createdAt.getMonth() - historyStart.getMonth())
    if (diff >= 0 && diff < historyMonths) adhesionsParMois[diff] += 1
  }

  return {
    periode,
    attendu,
    encaisseePeriode,
    resteARecouvrer: Math.max(attendu - encaisseePeriode, 0),
    tauxRecouvrement,
    cotisationMoyenne,
    nbCotisants: cotisants.length,
    impayes,
    montantImpayes,
    retard2,
    montantRetard2,
    paiements: {
      initiés,
      reussis,
      abandonnes: initiés - reussis,
      tauxConversion,
    },
    campagnes,
    boutique: {
      ca: boutiqueMois._sum.total ?? 0,
      commandes: boutiqueMois._count._all,
    },
    adhesionsParMois,
    geo,
    celluleAPreciser,
    totalActifs: actifsGeo.length,
  }
}
