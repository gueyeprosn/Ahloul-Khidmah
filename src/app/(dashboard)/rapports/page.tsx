import Link from "next/link"
import {
  Users,
  UserCheck,
  UserPlus,
  Archive,
  FileText,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SectionCard } from "@/components/shared/section-card"
import { FilterChips } from "@/components/shared/filter-chips"
import { Button } from "@/components/ui/button"
import { ExportCsvButton } from "@/components/rapports/export-csv-button"
import { prisma } from "@/lib/db"
import { parseMontantFcfa } from "@/lib/adherents-shared"
import { canalBucket, canalBucketLabel } from "@/lib/canaux"
import { formatFcfa } from "@/lib/format"
import { parsePeriode, shiftPeriode } from "@/lib/rapports-detail"

export const metadata = { title: "Rapports" }

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>
}) {
  const { periode: periodeParam } = await searchParams
  const periode = parsePeriode(periodeParam)
  const [y, m] = periode.split("-").map(Number)
  const monthStart = new Date(y, m - 1, 1)
  const monthEnd = new Date(y, m, 1)

  const [total, actifs, archives, mois, cellules, cotisationsMois, all] =
    await Promise.all([
      prisma.adherent.count(),
      prisma.adherent.count({ where: { status: "actif" } }),
      prisma.adherent.count({ where: { status: "archive" } }),
      prisma.adherent.count({
        where: {
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.cellule.findMany({
        include: { _count: { select: { adherents: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.cotisation.findMany({ where: { periode, statut: "paye" } }),
      prisma.adherent.findMany({
        select: {
          montant: true,
          montantAutre: true,
          canal: true,
          zoneRegion: true,
          status: true,
        },
      }),
    ])

  const collecté = cotisationsMois.reduce((s, c) => s + c.montant, 0)
  const engagementActifs = all
    .filter((a) => a.status === "actif")
    .reduce((s, a) => s + parseMontantFcfa(a.montant, a.montantAutre), 0)

  const byCanal = { en_ligne: 0, cellule: 0 }
  for (const a of all.filter((x) => x.status === "actif")) {
    const amount = parseMontantFcfa(a.montant, a.montantAutre)
    byCanal[canalBucket(a.canal)] += amount
  }

  // Cotisations réellement collectées par canal (période)
  const collectByCanal = { en_ligne: 0, cellule: 0 }
  for (const c of cotisationsMois) {
    collectByCanal[canalBucket(c.canal)] += c.montant
  }

  const byZone = new Map<string, number>()
  for (const a of all) {
    const z = a.zoneRegion || "Non précisé"
    byZone.set(z, (byZone.get(z) || 0) + 1)
  }

  const prev = shiftPeriode(periode, -1)
  const next = shiftPeriode(periode, 1)
  const current = parsePeriode()

  return (
    <>
      <PageHeader
        title="Rapports"
        description="Synthèse organisationnelle et exports PDF / CSV."
        actions={
          <>
            <Button
              size="sm"
              className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
              asChild
            >
              <Link href={`/rapports/detail?periode=${periode}`}>
                <FileText className="size-3.5" />
                Rapport détaillé PDF
              </Link>
            </Button>
            <ExportCsvButton />
            <Button size="sm" variant="outline" asChild>
              <a href={`/api/rapports/export-periode?type=cotisations&periode=${periode}`}>
                CSV cotisations
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={`/api/rapports/export-periode?type=contributions&periode=${periode}`}>
                CSV contributions
              </a>
            </Button>
          </>
        }
      />

      <FilterChips
        chips={[
          {
            href: `/rapports?periode=${prev}`,
            label: `← ${prev}`,
          },
          {
            href: `/rapports?periode=${periode}`,
            label: periode,
            active: true,
          },
          {
            href: `/rapports?periode=${next}`,
            label: `${next} →`,
          },
          {
            href: `/rapports?periode=${current}`,
            label: "Mois courant",
            active: periode === current,
          },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total adhérents" value={String(total)} icon={Users} />
        <KpiCard title="Actifs" value={String(actifs)} icon={UserCheck} />
        <KpiCard
          title="Nouveaux (période)"
          value={String(mois)}
          description={periode}
          icon={UserPlus}
        />
        <KpiCard title="Archivés" value={String(archives)} icon={Archive} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title={`Cotisations ${periode}`}
          description="Collecté vs engagement mensuel des actifs."
        >
          <div className="space-y-3 text-sm">
            <Row label="Collecté (payé)" value={formatFcfa(collecté)} />
            <Row
              label="Engagement actifs"
              value={formatFcfa(engagementActifs)}
            />
            <Row
              label="Taux"
              value={
                engagementActifs
                  ? `${Math.round((collecté / engagementActifs) * 100)} %`
                  : "—"
              }
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/cotisations">Ouvrir cotisations</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/rapports/detail?periode=${periode}`}>
                  Voir le rapport PDF
                </Link>
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Canaux"
          description="Engagements actifs + collecté période."
        >
          <div className="space-y-3 text-sm">
            {(["en_ligne", "cellule"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Row
                  label={`${canalBucketLabel(k)} — engagement`}
                  value={formatFcfa(byCanal[k])}
                />
                <Row
                  label={`${canalBucketLabel(k)} — collecté`}
                  value={formatFcfa(collectByCanal[k])}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Cellules" description="Effectifs par cellule.">
          <div className="space-y-2 text-sm">
            {cellules.length === 0 ? (
              <p className="text-muted-foreground">Aucune cellule.</p>
            ) : (
              cellules.map((c) => (
                <Row
                  key={c.id}
                  label={c.name}
                  value={String(c._count.adherents)}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Zones / régions"
          description="Répartition géographique."
        >
          <div className="space-y-2 text-sm">
            {[...byZone.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([zone, count]) => (
                <Row key={zone} label={zone} value={String(count)} />
              ))}
          </div>
        </SectionCard>
      </section>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--ak-ink-soft)]">{label}</span>
      <span className="font-medium tabular-nums text-[var(--ak-emerald-deep)]">
        {value}
      </span>
    </div>
  )
}
