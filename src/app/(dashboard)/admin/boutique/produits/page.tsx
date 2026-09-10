import Link from "next/link"
import { Package, Plus } from "lucide-react"
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
import { formatFcfa } from "@/lib/format"
import { availableStock, availabilityStatus } from "@/lib/store/catalog"

export const metadata = { title: "Produits — Boutique" }

export default async function AdminProduitsPage() {
  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } }, variants: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <>
      <PageHeader
        title="Produits"
        description="Catalogue de la boutique — prix, stock, disponibilité."
        actions={
          <>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- lien de téléchargement API, pas une page */}
            <a
              href="/api/store/admin/products/export"
              className="text-sm font-medium text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
            >
              Export CSV
            </a>
            <Button asChild className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]">
              <Link href="/admin/boutique/produits/nouveau">
                <Plus className="size-4" />
                Nouveau produit
              </Link>
            </Button>
          </>
        }
      />

      <SectionCard flush>
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun produit"
            description="Créez votre premier produit pour qu'il apparaisse dans la boutique."
            action={{ label: "Nouveau produit", href: "/admin/boutique/produits/nouveau" }}
          />
        ) : (
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Produit</Th>
                <Th>Catégorie</Th>
                <Th>Prix</Th>
                <Th>Stock</Th>
                <Th>Statut</Th>
                <Th />
              </DataTableHead>
              <DataTableBody>
                {products.map((p) => {
                  const hasVariants = p.variants.length > 0
                  const totalAvailable = hasVariants
                    ? p.variants.reduce((s, v) => s + availableStock(v), 0)
                    : availableStock(p)
                  const availability = availabilityStatus(totalAvailable, p.lowStockThreshold)
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <Link href={`/admin/boutique/produits/${p.id}`} className="font-medium text-[var(--ak-emerald-deep)] hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-xs text-[var(--ak-ink-soft)]">{p.sku}</p>
                      </Td>
                      <Td>{p.category?.name || "—"}</Td>
                      <Td>{formatFcfa(p.price)}</Td>
                      <Td>
                        {totalAvailable}
                        {availability === "out_of_stock" && (
                          <StatusBadge label="Rupture" variant="danger" className="ml-2" />
                        )}
                        {availability === "low_stock" && (
                          <StatusBadge label="Faible" variant="warning" className="ml-2" />
                        )}
                      </Td>
                      <Td>
                        <StatusBadge
                          label={p.active ? "Actif" : "Archivé"}
                          variant={p.active ? "success" : "neutral"}
                        />
                      </Td>
                      <Td>
                        <Link href={`/admin/boutique/produits/${p.id}`} className="text-sm text-[var(--ak-emerald-deep)] hover:underline">
                          Modifier
                        </Link>
                      </Td>
                    </Tr>
                  )
                })}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
        )}
      </SectionCard>
    </>
  )
}
