import Link from "next/link"
import { Layers, Plus } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
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
import { prisma } from "@/lib/db"

export const metadata = { title: "Collections — Boutique" }

const TYPE_LABEL: Record<string, string> = {
  PERMANENTE: "Permanente",
  SAISONNIERE: "Saisonnière",
  EVENEMENTIELLE: "Événementielle",
  LIMITEE: "Édition limitée",
  MEMBRE: "Réservée aux membres",
  SOLIDAIRE: "Solidaire",
}

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <>
      <PageHeader
        title="Collections"
        description="Collections éditoriales — thématiques, saisonnières ou événementielles."
        actions={
          <Button asChild className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]">
            <Link href="/admin/boutique/collections/nouveau">
              <Plus className="size-4" />
              Nouvelle collection
            </Link>
          </Button>
        }
      />

      <SectionCard flush>
        {collections.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Aucune collection"
            description="Créez une collection éditoriale pour mettre en avant une sélection de produits."
            action={{ label: "Nouvelle collection", href: "/admin/boutique/collections/nouveau" }}
          />
        ) : (
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Nom</Th>
                <Th>Type</Th>
                <Th>Produits</Th>
                <Th>Statut</Th>
                <Th />
              </DataTableHead>
              <DataTableBody>
                {collections.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link href={`/admin/boutique/collections/${c.id}`} className="font-medium text-[var(--ak-emerald-deep)] hover:underline">
                        {c.name}
                      </Link>
                    </Td>
                    <Td>{TYPE_LABEL[c.type] || c.type}</Td>
                    <Td>{c._count.products}</Td>
                    <Td>
                      <StatusBadge label={c.active ? "Active" : "Inactive"} variant={c.active ? "success" : "neutral"} />
                    </Td>
                    <Td>
                      <Link href={`/admin/boutique/collections/${c.id}`} className="text-sm text-[var(--ak-emerald-deep)] hover:underline">
                        Modifier
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
        )}
      </SectionCard>
    </>
  )
}
