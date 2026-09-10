import { Boxes } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
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
import { StockAdjustRow } from "@/components/store-admin/stock-adjust-row"
import { prisma } from "@/lib/db"
import { availableStock, availabilityStatus } from "@/lib/store/catalog"

export const metadata = { title: "Stock — Boutique" }

type Row = {
  key: string
  productId: string
  variantId: string | null
  label: string
  stock: number
  reserved: number
  available: number
  threshold: number
  availability: "in_stock" | "low_stock" | "out_of_stock"
}

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>
}) {
  const { filtre } = await searchParams
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: { where: { active: true } } },
    orderBy: { name: "asc" },
  })

  const rows: Row[] = []
  for (const p of products) {
    if (p.variants.length === 0) {
      const available = availableStock(p)
      rows.push({
        key: p.id,
        productId: p.id,
        variantId: null,
        label: p.name,
        stock: p.stock,
        reserved: p.reserved,
        available,
        threshold: p.lowStockThreshold,
        availability: availabilityStatus(available, p.lowStockThreshold),
      })
    } else {
      for (const v of p.variants) {
        const available = availableStock(v)
        rows.push({
          key: v.id,
          productId: p.id,
          variantId: v.id,
          label: `${p.name} — ${v.label}`,
          stock: v.stock,
          reserved: v.reserved,
          available,
          threshold: p.lowStockThreshold,
          availability: availabilityStatus(available, p.lowStockThreshold),
        })
      }
    }
  }

  const filtered = rows.filter((r) => {
    if (filtre === "faible") return r.availability === "low_stock"
    if (filtre === "rupture") return r.availability === "out_of_stock"
    return true
  })

  const chips = [
    { href: "/admin/boutique/stock", label: `Tout (${rows.length})`, active: !filtre },
    {
      href: "/admin/boutique/stock?filtre=faible",
      label: `Stock faible (${rows.filter((r) => r.availability === "low_stock").length})`,
      active: filtre === "faible",
    },
    {
      href: "/admin/boutique/stock?filtre=rupture",
      label: `Rupture (${rows.filter((r) => r.availability === "out_of_stock").length})`,
      active: filtre === "rupture",
    },
  ]

  return (
    <>
      <PageHeader title="Stock" description="Disponibilité réelle (stock − réservé) et ajustements manuels." />
      <FilterChips chips={chips} />

      <SectionCard flush>
        {filtered.length === 0 ? (
          <EmptyState icon={Boxes} title="Aucun résultat" description="Aucun produit ne correspond à ce filtre." />
        ) : (
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Produit</Th>
                <Th>Stock</Th>
                <Th>Réservé</Th>
                <Th>Disponible</Th>
                <Th>Statut</Th>
                <Th />
              </DataTableHead>
              <DataTableBody>
                {filtered.map((r) => (
                  <Tr key={r.key}>
                    <Td className="font-medium text-[var(--ak-ink)]">{r.label}</Td>
                    <Td>{r.stock}</Td>
                    <Td>{r.reserved}</Td>
                    <Td>{r.available}</Td>
                    <Td>
                      {r.availability === "out_of_stock" && <StatusBadge label="Rupture" variant="danger" />}
                      {r.availability === "low_stock" && <StatusBadge label="Faible" variant="warning" />}
                      {r.availability === "in_stock" && <StatusBadge label="OK" variant="success" />}
                    </Td>
                    <Td>
                      <StockAdjustRow
                        productId={r.productId}
                        variantId={r.variantId}
                        currentStock={r.stock}
                      />
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
