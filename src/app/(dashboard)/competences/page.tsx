import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sparkles, Search } from "lucide-react"
import { prisma } from "@/lib/db"

export const metadata = { title: "Professions" }

export default async function CompetencesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; profession?: string }>
}) {
  const { q = "", profession = "" } = await searchParams
  const query = q.trim().toLowerCase()
  const professionFilter = profession.trim()

  const adherents = await prisma.adherent.findMany({
    where: { status: { not: "archive" } },
    orderBy: [{ nom: "asc" }, { prenoms: "asc" }],
  })

  const byProfession = new Map<string, number>()
  const rows: {
    id: string
    name: string
    profession: string
    region: string
    tel: string
  }[] = []

  for (const a of adherents) {
    const prof =
      a.profession === "À préciser" ? "" : a.profession.trim()
    if (prof) {
      byProfession.set(prof, (byProfession.get(prof) || 0) + 1)
    }

    const hay =
      `${a.nom} ${a.prenoms} ${prof} ${a.autreProfession || ""} ${a.zoneRegion}`.toLowerCase()
    if (query && !hay.includes(query)) continue
    if (professionFilter && prof !== professionFilter) continue

    rows.push({
      id: a.id,
      name: `${a.prenoms} ${a.nom}`,
      profession: prof || "—",
      region: a.zoneRegion || "—",
      tel: a.tel,
    })
  }

  const topProfessions = [...byProfession.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  return (
    <>
      <PageHeader
        title="Professions"
        description="Annuaire des métiers déclarés par les membres."
      />

      <form
        className="flex max-w-xl flex-col gap-2 sm:flex-row"
        action="/competences"
        method="get"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Nom, profession, région…"
            className="border-[#DED2AE] bg-white pl-9"
          />
        </div>
        <input type="hidden" name="profession" value={professionFilter} />
        <Button type="submit" variant="secondary">
          Filtrer
        </Button>
      </form>

      {topProfessions.length > 0 ? (
        <FilterChips
          chips={[
            {
              href: query ? `/competences?q=${encodeURIComponent(q)}` : "/competences",
              label: "Toutes",
              active: !professionFilter,
            },
            ...topProfessions.map(([name, count]) => ({
              href: `/competences?profession=${encodeURIComponent(name)}${
                query ? `&q=${encodeURIComponent(q)}` : ""
              }`,
              label: `${name} (${count})`,
              active: professionFilter === name,
            })),
          ]}
        />
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucune profession trouvée"
          description="Les professions déclarées à la complétion de fiche apparaîtront ici."
        />
      ) : (
        <DataTable>
          <DataTableRoot>
            <DataTableHead>
              <Th>Membre</Th>
              <Th>Profession</Th>
              <Th className="hidden sm:table-cell">Région</Th>
            </DataTableHead>
            <DataTableBody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <Link
                      href={`/adherents/${row.id}`}
                      className="font-medium text-[var(--ak-emerald-deep)] hover:underline"
                    >
                      {row.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {row.tel}
                    </div>
                  </Td>
                  <Td>{row.profession}</Td>
                  <Td className="hidden text-muted-foreground sm:table-cell">
                    {row.region}
                  </Td>
                </Tr>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </DataTable>
      )}
    </>
  )
}
