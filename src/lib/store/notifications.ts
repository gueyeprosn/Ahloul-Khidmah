import { isWhatsAppCloudConfigured, sendWhatsAppCloudText } from "@/lib/whatsapp"
import { sendMail } from "@/lib/mail"
import { formatFcfa } from "@/lib/format"

export type NotifiableOrder = {
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  total: number
  shippingZone: string | null
  items: { productName: string; quantity: number }[]
}

/**
 * Best-effort : n'échoue jamais l'action métier (paiement confirmé,
 * changement de statut déjà appliqué) si la notification ne part pas —
 * même philosophie que logAudit.
 */
async function sendOrderNotification(order: NotifiableOrder, subject: string, body: string) {
  if (isWhatsAppCloudConfigured()) {
    try {
      await sendWhatsAppCloudText({ to: order.customerPhone, body })
    } catch (e) {
      console.error("notifyOrder: WhatsApp", e)
    }
  }
  if (order.customerEmail) {
    try {
      await sendMail({ to: order.customerEmail, subject, text: body })
    } catch (e) {
      console.error("notifyOrder: email", e)
    }
  }
}

export async function notifyOrderPaid(order: NotifiableOrder) {
  const itemsList = order.items.map((i) => `- ${i.productName} × ${i.quantity}`).join("\n")
  const body = [
    `Assalamu aleykum ${order.customerName},`,
    "",
    `Votre commande ${order.orderNumber} est confirmée — paiement reçu :`,
    itemsList,
    "",
    `Total : ${formatFcfa(order.total)}`,
    "",
    "Barkelu",
  ].join("\n")
  await sendOrderNotification(order, `Commande ${order.orderNumber} confirmée`, body)
}

const STATUS_MESSAGES: Record<string, (order: NotifiableOrder) => string> = {
  READY: (o) =>
    o.shippingZone === "retrait"
      ? `Votre commande ${o.orderNumber} est prête — vous pouvez venir la récupérer.`
      : `Votre commande ${o.orderNumber} est prête et va être expédiée.`,
  SHIPPED: (o) => `Votre commande ${o.orderNumber} a été expédiée.`,
  DELIVERED: (o) => `Votre commande ${o.orderNumber} a été livrée. Merci pour votre confiance !`,
  REFUNDED: (o) => `Votre commande ${o.orderNumber} a été remboursée.`,
}

export async function notifyOrderStatusChange(
  order: NotifiableOrder,
  status: "READY" | "SHIPPED" | "DELIVERED" | "REFUNDED"
) {
  const build = STATUS_MESSAGES[status]
  if (!build) return
  await sendOrderNotification(order, `Commande ${order.orderNumber}`, build(order))
}
