import { Wallet, HeartHandshake, PiggyBank } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { FilterChips } from "@/components/shared/filter-chips"
import { KpiCard } from "@/components/shared/kpi-card"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { prisma } from "@/lib/db"
import { formatFcfa } from "@/lib/format"
import { buildCollecteSeries, GRANULARITY_COUNT, type Granularity } from "@/lib/rapports-collectes"

export const metadata = { title: "Collectes" }

const GRANULARITY_LABEL: Record<Granularity, string> = {
  jour: "Jour",
  semaine: "Semaine",
  mois: "Mois",
}

function parseGranularity(raw?: string): Granularity {
  return raw === "jour" || raw === "semaine" || raw === "mois" ? raw : "jour"
}

export default async function CollectesPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>
}) {
  const { vue } = await searchParams
  const granularity = parseGranularity(vue)
  const count = GRANULARITY_COUNT[granularity]

  const [cotisations, dons] = await Promise.all([
    prisma.cotisation.findMany({
      where: { statut: "paye", paidAt: { not: null } },
      select: { paidAt: true, montant: true },
    }),
    prisma.contribution.findMany({
      where: { status: "completed" },
      select: { updatedAt: true, amount: true },
    }),
  ])

  const series = buildCollecteSeries(
    cotisations.map((c) => ({ date: c.paidAt as Date, montant: c.montant })),
    dons.map((d) => ({ date: d.updatedAt, montant: d.amount })),
    granularity,
    count
  )

  const totalCotisations = series.reduce((s, b) => s + b.cotisations, 0)
  const totalDons = series.reduce((s, b) => s + b.dons, 0)
  const maxTotal = Math.max(...series.map((b) => b.total), 1)
  const fenetre = `${count} derniers${granularity === "jour" ? " jours" : granularity === "semaine" ? "es semaines" : " mois"}`

  return (
    <>
      <PageHeader
        title="Collectes"
        description="Cotisations et dons encaissés — vue par jour, semaine ou mois."
      />

      <FilterChips
        chips={(["jour", "semaine", "mois"] as const).map((g) => ({
          href: `/rapports/collectes?vue=${g}`,
          label: GRANULARITY_LABEL[g],
          active: granularity === g,
        }))}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Cotisations"
          value={formatFcfa(totalCotisations)}
          description={fenetre}
          icon={Wallet}
        />
        <KpiCard
          title="Dons"
          value={formatFcfa(totalDons)}
          description={fenetre}
          icon={HeartHandshake}
        />
        <KpiCard
          title="Total collecté"
          value={formatFcfa(totalCotisations + totalDons)}
          description={fenetre}
          icon={PiggyBank}
        />
      </section>

      <SectionCard
        title="Détail par période"
        description="Montants réellement encaissés (date de paiement)."
        flush
      >
        <DataTable className="rounded-none border-0">
          <DataTableRoot>
            <DataTableHead>
              <Th>Période</Th>
              <Th>Cotisations</Th>
              <Th>Dons</Th>
              <Th>Total</Th>
              <Th />
            </DataTableHead>
            <DataTableBody>
              {series.map((b) => (
                <Tr key={b.key}>
                  <Td className="font-medium text-[var(--ak-ink)]">{b.label}</Td>
                  <Td className="tabular-nums">{formatFcfa(b.cotisations)}</Td>
                  <Td className="tabular-nums">{formatFcfa(b.dons)}</Td>
                  <Td className="tabular-nums font-medium text-[var(--ak-emerald-deep)]">
                    {formatFcfa(b.total)}
                  </Td>
                  <Td>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--ak-ivory)]">
                      <div
                        className="h-full rounded-full bg-[var(--ak-emerald-mid)]"
                        style={{ width: `${Math.round((b.total / maxTotal) * 100)}%` }}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </DataTable>
      </SectionCard>
    </>
  )
}
