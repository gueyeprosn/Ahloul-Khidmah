import { PageHeader } from "@/components/shared/page-header"
import { CellulesClient } from "@/components/cellules/cellules-client"
import { prisma } from "@/lib/db"

export const metadata = { title: "Cellules" }

export default async function CellulesPage() {
  const cellules = await prisma.cellule.findMany({
    where: { name: { not: "À préciser" } },
    orderBy: { name: "asc" },
    include: { _count: { select: { adherents: true } } },
  })

  const initial = cellules.map((c) => ({
    id: c.id,
    name: c.name,
    zone: c.zone,
    count: c._count.adherents,
  }))

  return (
    <>
      <PageHeader
        title="Cellules"
        description={`${initial.length} cellule${initial.length > 1 ? "s" : ""} — organisation territoriale.`}
      />
      <CellulesClient initial={initial} />
    </>
  )
}
