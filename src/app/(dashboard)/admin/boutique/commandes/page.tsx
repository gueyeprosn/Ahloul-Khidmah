import Link from "next/link"
import { ClipboardList } from "lucide-react"
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
import { prisma } from "@/lib/db"
import { formatDateTime, formatFcfa } from "@/lib/format"
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/features/store/order-status"

export const metadata = { title: "Commandes — Boutique" }

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  PENDING: "neutral",
  PROCESSING: "info",
  READY: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "warning",
  FAILED: "danger",
}

export default async function AdminCommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const chips = [
    { href: "/admin/boutique/commandes", label: "Toutes", active: !status },
    ...Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({
      href: `/admin/boutique/commandes?status=${value}`,
      label,
      active: status === value,
    })),
  ]

  return (
    <>
      <PageHeader
        title="Commandes"
        description="Suivi des commandes de la boutique."
        actions={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- lien de téléchargement API, pas une page
          <a
            href="/api/store/admin/orders/export"
            className="text-sm font-medium text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
          >
            Export CSV
          </a>
        }
      />
      <FilterChips chips={chips} />

      <SectionCard flush>
        {orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Aucune commande" description="Aucune commande ne correspond à ce filtre." />
        ) : (
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Commande</Th>
                <Th>Client</Th>
                <Th>Date</Th>
                <Th>Montant</Th>
                <Th>Paiement</Th>
                <Th>Statut</Th>
                <Th />
              </DataTableHead>
              <DataTableBody>
                {orders.map((o) => (
                  <Tr key={o.id}>
                    <Td className="font-medium text-[var(--ak-emerald-deep)]">{o.orderNumber}</Td>
                    <Td>
                      {o.customerName}
                      <p className="text-xs text-[var(--ak-ink-soft)]">{o.customerPhone}</p>
                    </Td>
                    <Td>{formatDateTime(o.createdAt)}</Td>
                    <Td>{formatFcfa(o.total)}</Td>
                    <Td>
                      <StatusBadge
                        label={PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus}
                        variant={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "FAILED" ? "danger" : "neutral"}
                      />
                    </Td>
                    <Td>
                      <StatusBadge label={ORDER_STATUS_LABEL[o.status] || o.status} variant={STATUS_VARIANT[o.status] || "neutral"} />
                    </Td>
                    <Td>
                      <Link href={`/admin/boutique/commandes/${o.id}`} className="text-sm text-[var(--ak-emerald-deep)] hover:underline">
                        Voir
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
