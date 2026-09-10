import Link from "next/link"
import { Tag, Plus } from "lucide-react"
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

export const metadata = { title: "Coupons — Boutique" }

const TYPE_LABEL: Record<string, string> = {
  PERCENTAGE: "Pourcentage",
  FIXED_AMOUNT: "Montant fixe",
  FREE_SHIPPING: "Livraison gratuite",
}

function valueLabel(type: string, value: number) {
  if (type === "PERCENTAGE") return `${value}%`
  if (type === "FIXED_AMOUNT") return formatFcfa(value)
  return "—"
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { usages: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Codes de réduction — pourcentage, montant fixe ou livraison gratuite."
        actions={
          <Button asChild className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]">
            <Link href="/admin/boutique/coupons/nouveau">
              <Plus className="size-4" />
              Nouveau coupon
            </Link>
          </Button>
        }
      />

      <SectionCard flush>
        {coupons.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Aucun coupon"
            description="Créez un code de réduction pour vos clients."
            action={{ label: "Nouveau coupon", href: "/admin/boutique/coupons/nouveau" }}
          />
        ) : (
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Code</Th>
                <Th>Type</Th>
                <Th>Valeur</Th>
                <Th>Utilisations</Th>
                <Th>Statut</Th>
                <Th />
              </DataTableHead>
              <DataTableBody>
                {coupons.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link href={`/admin/boutique/coupons/${c.id}`} className="font-medium text-[var(--ak-emerald-deep)] hover:underline">
                        {c.code}
                      </Link>
                    </Td>
                    <Td>{TYPE_LABEL[c.type] || c.type}</Td>
                    <Td>{valueLabel(c.type, c.value)}</Td>
                    <Td>
                      {c._count.usages}
                      {c.maxUses ? ` / ${c.maxUses}` : ""}
                    </Td>
                    <Td>
                      <StatusBadge label={c.active ? "Actif" : "Inactif"} variant={c.active ? "success" : "neutral"} />
                    </Td>
                    <Td>
                      <Link href={`/admin/boutique/coupons/${c.id}`} className="text-sm text-[var(--ak-emerald-deep)] hover:underline">
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
