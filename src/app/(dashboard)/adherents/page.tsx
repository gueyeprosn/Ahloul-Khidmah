import Link from "next/link"
import { Plus, Search, Users } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
import { FilterChips } from "@/components/shared/filter-chips"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { prisma } from "@/lib/db"
import {
  canalLabel,
  parseMontantFcfa,
  statusLabel,
} from "@/lib/adherents"
import { formatDate, formatFcfa } from "@/lib/format"

export const metadata = { title: "Adhérents" }

const statusVariant = {
  Actif: "success",
  "En attente": "warning",
  Archivé: "neutral",
} as const

export default async function AdherentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    fiche?: string
    status?: string
    page?: string
  }>
}) {
  const { q = "", fiche = "", status = "", page: pageRaw = "1" } =
    await searchParams
  const query = q.trim()
  const ficheFilter =
    fiche === "incomplete"
      ? "incomplete"
      : fiche === "complete"
        ? "complete"
        : ""
  const statusFilter = ["actif", "en_attente", "archive"].includes(status)
    ? status
    : ""

  const where = {
    AND: [
      query
        ? {
            OR: [
              { nom: { contains: query } },
              { prenoms: { contains: query } },
              { id: { contains: query } },
              { tel: { contains: query } },
              { zoneRegion: { contains: query } },
              { profession: { contains: query } },
            ],
          }
        : {},
      ficheFilter === "incomplete"
        ? { ficheComplete: false }
        : ficheFilter === "complete"
          ? { ficheComplete: true }
          : {},
      statusFilter ? { status: statusFilter } : {},
    ],
  }

  const PAGE_SIZE = 50
  const page = Math.max(1, Number(pageRaw) || 1)

  const [incompleteCount, totalFiltered, adherents] = await Promise.all([
    prisma.adherent.count({ where: { ficheComplete: false } }),
    prisma.adherent.count({ where }),
    prisma.adherent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))

  const baseQs = (extra: Record<string, string>) => {
    const p = new URLSearchParams()
    if (query) p.set("q", query)
    Object.entries(extra).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    const s = p.toString()
    return s ? `/adherents?${s}` : "/adherents"
  }

  return (
    <>
      <PageHeader
        title="Adhérents"
        description={`${totalFiltered} fiche${totalFiltered > 1 ? "s" : ""} — annuaire des membres.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <a
                href={`/api/adherents/export?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(ficheFilter ? { fiche: ficheFilter } : {}),
                  ...(statusFilter ? { status: statusFilter } : {}),
                }).toString()}`}
              >
                Export CSV
              </a>
            </Button>
            <Button
              size="sm"
              className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
              asChild
            >
              <Link href="/adherents/nouveau">
                <Plus className="size-3.5" />
                Nouvelle adhésion
              </Link>
            </Button>
          </div>
        }
      />

      <form className="flex max-w-md gap-2" action="/adherents" method="get">
        {ficheFilter ? (
          <input type="hidden" name="fiche" value={ficheFilter} />
        ) : null}
        {statusFilter ? (
          <input type="hidden" name="status" value={statusFilter} />
        ) : null}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Rechercher nom, téléphone, région, ID…"
            className="border-[#DED2AE] bg-white pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
      </form>

      <FilterChips
        chips={[
          {
            href: "/adherents",
            label: "Tous",
            active: !ficheFilter && !statusFilter,
          },
          {
            href: baseQs({ fiche: "incomplete" }),
            label: `Fiches incomplètes (${incompleteCount})`,
            active: ficheFilter === "incomplete",
          },
          {
            href: baseQs({ fiche: "complete" }),
            label: "Fiches complètes",
            active: ficheFilter === "complete",
          },
          {
            href: baseQs({ status: "en_attente", fiche: ficheFilter }),
            label: "En attente",
            active: statusFilter === "en_attente",
          },
          {
            href: baseQs({ status: "actif", fiche: ficheFilter }),
            label: "Actifs",
            active: statusFilter === "actif",
          },
        ]}
      />

      {adherents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            query || ficheFilter || statusFilter
              ? "Aucun résultat"
              : "Aucun adhérent"
          }
          description={
            query || ficheFilter || statusFilter
              ? "Essayez un autre filtre."
              : "Les adhésions du site public apparaîtront ici automatiquement."
          }
          action={{ label: "Créer une adhésion", href: "/adherents/nouveau" }}
        />
      ) : (
        <>
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Adhérent</Th>
                <Th className="hidden sm:table-cell">Région</Th>
                <Th>Cotisation</Th>
                <Th className="hidden md:table-cell">Canal</Th>
                <Th className="hidden lg:table-cell">Badge</Th>
                <Th className="hidden md:table-cell">PIN</Th>
                <Th className="hidden lg:table-cell">Date</Th>
                <Th>Statut</Th>
              </DataTableHead>
              <DataTableBody>
                {adherents.map((row) => {
                  const label = statusLabel(
                    row.status
                  ) as keyof typeof statusVariant
                  const amount = parseMontantFcfa(
                    row.montant,
                    row.montantAutre
                  )
                  const region = row.zoneRegion || "—"
                  return (
                    <Tr key={row.id}>
                      <Td>
                        <Link
                          href={`/adherents/${row.id}`}
                          className="font-medium text-[var(--ak-emerald-deep)] hover:underline"
                        >
                          {row.prenoms} {row.nom}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {row.id} · {row.tel}
                        </div>
                      </Td>
                      <Td className="hidden text-muted-foreground sm:table-cell">
                        {region}
                        {!row.ficheComplete ? (
                          <div className="text-xs text-[color-mix(in_oklch,var(--ak-gold-dark),var(--ak-ink)_40%)]">
                            Fiche incomplète
                          </div>
                        ) : null}
                      </Td>
                      <Td className="tabular-nums">{formatFcfa(amount)}</Td>
                      <Td className="hidden text-muted-foreground md:table-cell">
                        {canalLabel(row.canal)}
                      </Td>
                      <Td className="hidden text-muted-foreground lg:table-cell">
                        {row.badgeSentAt ? (
                          <StatusBadge label="Envoyé" variant="success" />
                        ) : (
                          <StatusBadge label="—" variant="neutral" />
                        )}
                      </Td>
                      <Td className="hidden md:table-cell">
                        {row.pinHash ? (
                          <StatusBadge label="Défini" variant="success" />
                        ) : (
                          <StatusBadge label="Non défini" variant="warning" />
                        )}
                      </Td>
                      <Td className="hidden text-muted-foreground lg:table-cell">
                        {formatDate(row.createdAt)}
                      </Td>
                      <Td>
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge
                            label={label}
                            variant={statusVariant[label] ?? "neutral"}
                          />
                          {!row.ficheComplete ? (
                            <StatusBadge
                              label="Incomplète"
                              variant="warning"
                            />
                          ) : null}
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                Page {page} / {pageCount} · {totalFiltered} fiche(s)
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      href={baseQs({
                        fiche: ficheFilter,
                        status: statusFilter,
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
                      href={baseQs({
                        fiche: ficheFilter,
                        status: statusFilter,
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
    </>
  )
}
