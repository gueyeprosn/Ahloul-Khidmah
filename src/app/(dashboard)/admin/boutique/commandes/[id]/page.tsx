import Link from "next/link"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { OrderStatusActions } from "@/components/store-admin/order-status-actions"
import { prisma } from "@/lib/db"
import { formatDateTime, formatFcfa } from "@/lib/format"
import { shippingLabelFor } from "@/features/store/shipping"
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/features/store/order-status"

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } })
  return { title: order?.orderNumber || "Commande" }
}

export default async function CommandeDetailPage({ params }: Params) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      adherent: { select: { id: true, nom: true, prenoms: true } },
    },
  })
  if (!order) notFound()

  let shippingAddress: { line1?: string; city?: string; landmark?: string } | null =
    null
  if (order.shippingAddress) {
    try {
      shippingAddress = JSON.parse(order.shippingAddress) as {
        line1?: string
        city?: string
        landmark?: string
      }
    } catch {
      shippingAddress = null
    }
  }

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={`Créée le ${formatDateTime(order.createdAt)}`}
        actions={<OrderStatusActions orderId={order.id} status={order.status} />}
      />

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <SectionCard title="Articles" flush>
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Produit</Th>
                <Th>SKU</Th>
                <Th>Prix unitaire</Th>
                <Th>Qté</Th>
                <Th>Sous-total</Th>
              </DataTableHead>
              <DataTableBody>
                {order.items.map((item) => (
                  <Tr key={item.id}>
                    <Td>{item.productName}</Td>
                    <Td className="text-xs text-[var(--ak-ink-soft)]">{item.sku}</Td>
                    <Td>{formatFcfa(item.unitPrice)}</Td>
                    <Td>{item.quantity}</Td>
                    <Td>{formatFcfa(item.subtotal)}</Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>

          <div className="mt-4 space-y-1 border-t border-[#E6DCC0] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--ak-ink-soft)]">Sous-total</span>
              <span>{formatFcfa(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Réduction{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>-{formatFcfa(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--ak-ink-soft)]">
                Livraison{order.shippingZone ? ` — ${shippingLabelFor(order.shippingZone)}` : ""}
              </span>
              <span>{formatFcfa(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[var(--ak-emerald-deep)]">
              <span>Total</span>
              <span>{formatFcfa(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 rounded-xl bg-[var(--ak-ivory)] p-3 text-sm text-[var(--ak-ink-soft)]">
              <span className="font-medium text-[var(--ak-ink)]">Note client : </span>
              {order.notes}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Client">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--ak-ink-soft)]">Nom</dt>
              <dd className="font-medium text-[var(--ak-ink)]">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-[var(--ak-ink-soft)]">Téléphone</dt>
              <dd className="font-medium text-[var(--ak-ink)]">{order.customerPhone}</dd>
            </div>
            {order.customerEmail && (
              <div>
                <dt className="text-[var(--ak-ink-soft)]">Email</dt>
                <dd className="font-medium text-[var(--ak-ink)]">{order.customerEmail}</dd>
              </div>
            )}
            <div>
              <dt className="text-[var(--ak-ink-soft)]">Livraison</dt>
              <dd className="font-medium text-[var(--ak-ink)]">
                {order.shippingZone
                  ? shippingLabelFor(order.shippingZone)
                  : "—"}
              </dd>
            </div>
            {shippingAddress && (
              <div>
                <dt className="text-[var(--ak-ink-soft)]">Adresse</dt>
                <dd className="font-medium text-[var(--ak-ink)]">
                  {shippingAddress.line1}
                  {shippingAddress.city ? `, ${shippingAddress.city}` : ""}
                  {shippingAddress.landmark ? (
                    <span className="mt-1 block text-xs font-normal text-[var(--ak-ink-soft)]">
                      Repère : {shippingAddress.landmark}
                    </span>
                  ) : null}
                </dd>
              </div>
            )}
            {order.adherent && (
              <div>
                <dt className="text-[var(--ak-ink-soft)]">Membre</dt>
                <dd>
                  <Link href={`/adherents/${order.adherent.id}`} className="font-medium text-[var(--ak-emerald-deep)] hover:underline">
                    {order.adherent.prenoms} {order.adherent.nom}
                  </Link>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[var(--ak-ink-soft)]">Statut commande</dt>
              <dd><StatusBadge label={ORDER_STATUS_LABEL[order.status] || order.status} /></dd>
            </div>
            <div>
              <dt className="text-[var(--ak-ink-soft)]">Statut paiement</dt>
              <dd><StatusBadge label={PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus} /></dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </>
  )
}
