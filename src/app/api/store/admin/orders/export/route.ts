import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { toCsv, csvResponse } from "@/lib/csv"
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/features/store/order-status"
import { shippingLabelFor } from "@/features/store/shipping"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  })

  const header = [
    "numero_commande",
    "date",
    "client",
    "telephone",
    "email",
    "statut_commande",
    "statut_paiement",
    "articles",
    "sous_total",
    "reduction",
    "code_promo",
    "livraison",
    "zone_livraison",
    "total",
  ]

  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt.toISOString(),
    o.customerName,
    o.customerPhone,
    o.customerEmail || "",
    ORDER_STATUS_LABEL[o.status] || o.status,
    PAYMENT_STATUS_LABEL[o.paymentStatus] || o.paymentStatus,
    o.items.map((i) => `${i.productName} x${i.quantity}`).join(", "),
    o.subtotal,
    o.discount,
    o.couponCode || "",
    o.shippingCost,
    o.shippingZone ? shippingLabelFor(o.shippingZone) : "",
    o.total,
  ])

  const filename = `commandes-${new Date().toISOString().slice(0, 10)}.csv`
  return csvResponse(filename, toCsv(header, rows))
}
