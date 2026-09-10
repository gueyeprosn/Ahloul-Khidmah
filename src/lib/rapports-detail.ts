import { prisma } from "@/lib/db"
import { parseMontantFcfa, canalLabel, statusLabel } from "@/lib/adherents-shared"
import { canalBucket, canalBucketLabel } from "@/lib/canaux"
import { campagneLabel } from "@/features/contributions/schema"

export function parsePeriode(raw?: string | null) {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function shiftPeriode(periode: string, delta: number) {
  const [y, m] = periode.split("-").map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function formatPeriodeLabel(periode: string) {
  const [y, m] = periode.split("-").map(Number)
  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export type DetailedReport = Awaited<ReturnType<typeof buildDetailedReport>>

export async function buildDetailedReport(periode: string) {
  const [y, m] = periode.split("-").map(Number)
  const monthStart = new Date(y, m - 1, 1)
  const monthEnd = new Date(y, m, 1)

  const [
    total,
    actifs,
    archives,
    enAttente,
    fichesIncompletes,
    nouveaux,
    cellules,
    cotisationsPeriode,
    actifsList,
    contributionsPeriode,
    contributionsCompleted,
  ] = await Promise.all([
    prisma.adherent.count(),
    prisma.adherent.count({ where: { status: "actif" } }),
    prisma.adherent.count({ where: { status: "archive" } }),
    prisma.adherent.count({ where: { status: "en_attente" } }),
    prisma.adherent.count({ where: { ficheComplete: false } }),
    prisma.adherent.findMany({
      where: { createdAt: { gte: monthStart, lt: monthEnd } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nom: true,
        prenoms: true,
        tel: true,
        celluleLocale: true,
        zoneRegion: true,
        status: true,
        montant: true,
        montantAutre: true,
        canal: true,
        ficheComplete: true,
        createdAt: true,
      },
    }),
    prisma.cellule.findMany({
      include: { _count: { select: { adherents: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.cotisation.findMany({
      where: { periode },
      include: {
        adherent: {
          select: {
            id: true,
            nom: true,
            prenoms: true,
            celluleLocale: true,
            canal: true,
          },
        },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.adherent.findMany({
      where: { status: "actif" },
      orderBy: [{ nom: "asc" }, { prenoms: "asc" }],
      select: {
        id: true,
        nom: true,
        prenoms: true,
        tel: true,
        celluleLocale: true,
        zoneRegion: true,
        montant: true,
        montantAutre: true,
        canal: true,
        ficheComplete: true,
      },
    }),
    prisma.contribution.findMany({
      where: {
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contribution.aggregate({
      where: {
        status: "completed",
        createdAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const paidMap = new Map(
    cotisationsPeriode
      .filter((c) => c.statut === "paye")
      .map((c) => [c.adherentId, c])
  )

  const collecté = cotisationsPeriode
    .filter((c) => c.statut === "paye")
    .reduce((s, c) => s + c.montant, 0)

  const engagement = actifsList.reduce(
    (s, a) => s + parseMontantFcfa(a.montant, a.montantAutre),
    0
  )

  const unpaidActifs = actifsList
    .filter((a) => !paidMap.has(a.id))
    .map((a) => ({
      id: a.id,
      name: `${a.prenoms} ${a.nom}`,
      cellule: a.celluleLocale === "À préciser" ? "—" : a.celluleLocale,
      tel: a.tel,
      expected: parseMontantFcfa(a.montant, a.montantAutre),
      canal: canalLabel(a.canal),
    }))

  const paidRows = cotisationsPeriode
    .filter((c) => c.statut === "paye")
    .map((c) => ({
      id: c.id,
      name: `${c.adherent.prenoms} ${c.adherent.nom}`,
      cellule:
        c.adherent.celluleLocale === "À préciser"
          ? "—"
          : c.adherent.celluleLocale,
      montant: c.montant,
      canal: canalLabel(c.canal),
      paidAt: c.paidAt,
    }))

  const collectByCanal = { en_ligne: 0, cellule: 0 }
  const engagementByCanal = { en_ligne: 0, cellule: 0 }
  for (const c of cotisationsPeriode.filter((x) => x.statut === "paye")) {
    collectByCanal[canalBucket(c.canal)] += c.montant
  }
  for (const a of actifsList) {
    engagementByCanal[canalBucket(a.canal)] += parseMontantFcfa(
      a.montant,
      a.montantAutre
    )
  }

  const byZone = new Map<string, number>()
  for (const a of actifsList) {
    const z = a.zoneRegion || "Non précisé"
    byZone.set(z, (byZone.get(z) || 0) + 1)
  }

  const byCellule = cellules
    .map((c) => ({
      name: c.name,
      zone: c.zone || "—",
      count: c._count.adherents,
    }))
    .sort((a, b) => b.count - a.count)

  const contributionRows = contributionsPeriode.map((c) => ({
    id: c.id,
    name:
      [c.prenoms, c.nom].filter(Boolean).join(" ").trim() || "Anonyme",
    amount: c.amount,
    campagne: campagneLabel(c.campagne),
    status: c.status,
    createdAt: c.createdAt,
  }))

  const taux =
    engagement > 0 ? Math.round((collecté / engagement) * 100) : null

  return {
    periode,
    periodeLabel: formatPeriodeLabel(periode),
    generatedAt: new Date(),
    kpis: {
      total,
      actifs,
      archives,
      enAttente,
      fichesIncompletes,
      nouveaux: nouveaux.length,
      collecté,
      engagement,
      taux,
      unpaidCount: unpaidActifs.length,
      unpaidAmount: unpaidActifs.reduce((s, r) => s + r.expected, 0),
      contributionsCount: contributionsCompleted._count,
      contributionsAmount: contributionsCompleted._sum.amount || 0,
      contributionsPending: contributionsPeriode.filter(
        (c) => c.status === "pending"
      ).length,
    },
    channels: (["en_ligne", "cellule"] as const).map((k) => ({
      key: k,
      label: canalBucketLabel(k),
      engagement: engagementByCanal[k],
      collecté: collectByCanal[k],
    })),
    cellules: byCellule,
    zones: [...byZone.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([zone, count]) => ({ zone, count })),
    nouveaux: nouveaux.map((a) => ({
      id: a.id,
      name: `${a.prenoms} ${a.nom}`,
      tel: a.tel,
      cellule: a.celluleLocale === "À préciser" ? "—" : a.celluleLocale,
      zone: a.zoneRegion,
      status: statusLabel(a.status),
      montant: parseMontantFcfa(a.montant, a.montantAutre),
      canal: canalLabel(a.canal),
      ficheComplete: a.ficheComplete,
      createdAt: a.createdAt,
    })),
    paidRows,
    unpaidActifs,
    contributions: contributionRows,
  }
}
