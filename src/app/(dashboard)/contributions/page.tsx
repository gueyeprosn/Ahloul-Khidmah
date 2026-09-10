import Link from "next/link"
import { HandCoins, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { KpiCard } from "@/components/shared/kpi-card"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterChips } from "@/components/shared/filter-chips"
import { SectionCard } from "@/components/shared/section-card"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { campagneLabel } from "@/features/contributions/schema"
import { formatDate, formatFcfa } from "@/lib/format"
import { prisma } from "@/lib/db"
import { ContributionActions } from "@/components/contributions/contributions-actions"

export const metadata = { title: "Contributions" }

function statusLabel(status: string) {
  if (status === "completed") return "Confirmée"
  if (status === "canceled") return "Annulée"
  return "En attente"
}

const PAGE_SIZE = 50

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; campagne?: string; page?: string }>
}) {
  const { status = "", campagne = "", page: pageRaw = "1" } = await searchParams
  const statusFilter = ["pending", "completed", "canceled"].includes(status)
    ? status
    : ""
  const campagneFilter = [
    "general",
    "touba",
    "magal",
    "education",
    "autre",
  ].includes(campagne)
    ? campagne
    : ""
  const page = Math.max(1, Number(pageRaw) || 1)

  const where = {
    AND: [
      statusFilter ? { status: statusFilter } : {},
      campagneFilter ? { campagne: campagneFilter } : {},
    ],
  }

  const [totalFiltered, rows, completedAgg, pendingCount] = await Promise.all([
    prisma.contribution.count({ where }),
    prisma.contribution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { payment: true },
    }),
    prisma.contribution.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.contribution.count({ where: { status: "pending" } }),
  ])
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams()
    Object.entries(extra).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    const s = p.toString()
    return s ? `/contributions?${s}` : "/contributions"
  }

  return (
    <>
      <PageHeader
        title="Contributions"
        description="Dons et soutiens ponctuels — hors adhésion membre."
        actions={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- lien de téléchargement API, pas une page
          <a
            href="/api/contributions/export"
            className="text-sm font-medium text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
          >
            Export CSV
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total confirmé"
          value={formatFcfa(completedAgg._sum.amount || 0)}
          icon={HandCoins}
        />
        <KpiCard
          title="Confirmées"
          value={String(completedAgg._count)}
          icon={CheckCircle2}
        />
        <KpiCard
          title="En attente"
          value={String(pendingCount)}
          description="paiement non confirmé"
          icon={Clock}
        />
      </div>

      <FilterChips
        chips={[
          {
            href: "/contributions",
            label: "Toutes",
            active: !statusFilter && !campagneFilter,
          },
          {
            href: qs({ status: "pending", campagne: campagneFilter }),
            label: "En attente",
            active: statusFilter === "pending",
          },
          {
            href: qs({ status: "completed", campagne: campagneFilter }),
            label: "Confirmées",
            active: statusFilter === "completed",
          },
          {
            href: qs({ status: statusFilter, campagne: "general" }),
            label: "Soutien général",
            active: campagneFilter === "general",
          },
          {
            href: qs({ status: statusFilter, campagne: "touba" }),
            label: "Touba",
            active: campagneFilter === "touba",
          },
          {
            href: qs({ status: statusFilter, campagne: "magal" }),
            label: "Magal",
            active: campagneFilter === "magal",
          },
          {
            href: qs({ status: statusFilter, campagne: "education" }),
            label: "Éducation",
            active: campagneFilter === "education",
          },
          {
            href: qs({ status: statusFilter, campagne: "autre" }),
            label: "Autre",
            active: campagneFilter === "autre",
          },
        ]}
      />

      <SectionCard
        title="Historique"
        description="Un don avec numéro de téléphone crée automatiquement une fiche membre (sans cotisation mensuelle)."
        flush
      >
        {rows.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={HandCoins}
            title="Aucune contribution"
            description="Les dons du site public apparaîtront ici."
          />
        ) : (
          <>
          <DataTable className="rounded-none border-0">
            <DataTableRoot>
              <DataTableHead>
                <Th>Date</Th>
                <Th>Contributeur</Th>
                <Th>Montant</Th>
                <Th>Campagne</Th>
                <Th>Statut</Th>
                <Th>Contact</Th>
                <Th>Action</Th>
              </DataTableHead>
              <DataTableBody>
                {rows.map((c) => {
                  const name =
                    [c.prenoms, c.nom].filter(Boolean).join(" ").trim() ||
                    "Anonyme"
                  return (
                    <Tr key={c.id}>
                      <Td className="whitespace-nowrap">
                        {formatDate(c.createdAt)}
                      </Td>
                      <Td>
                        <div className="font-medium text-[var(--ak-emerald-deep)]">
                          {name}
                        </div>
                        {c.message ? (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                            {c.message}
                          </p>
                        ) : null}
                      </Td>
                      <Td className="font-medium whitespace-nowrap tabular-nums">
                        {formatFcfa(c.amount)}
                      </Td>
                      <Td>{campagneLabel(c.campagne)}</Td>
                      <Td>
                        <StatusBadge
                          label={statusLabel(c.status)}
                          variant={
                            c.status === "completed"
                              ? "success"
                              : c.status === "canceled"
                                ? "danger"
                                : "warning"
                          }
                        />
                      </Td>
                      <Td className="text-muted-foreground">
                        {c.tel || c.email || "—"}
                      </Td>
                      <Td>
                        <ContributionActions
                          contributionId={c.id}
                          paymentId={c.payment?.id ?? null}
                          phone={c.tel || ""}
                          status={c.status}
                        />
                      </Td>
                    </Tr>
                  )
                })}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Page {page} / {pageCount} · {totalFiltered} contribution
                {totalFiltered > 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={qs({
                        status: statusFilter,
                        campagne: campagneFilter,
                        page: String(page - 1),
                      })}
                    >
                      Précédent
                    </Link>
                  </Button>
                ) : null}
                {page < pageCount ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={qs({
                        status: statusFilter,
                        campagne: campagneFilter,
                        page: String(page + 1),
                      })}
                    >
                      Suivant
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
          </>
        )}
      </SectionCard>
    </>
  )
}
