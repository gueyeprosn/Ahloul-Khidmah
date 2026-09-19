import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { orderStatusUpdateSchema } from "@/features/store/product-schema"
import { canTransition } from "@/features/store/order-status"
import { notifyOrderStatusChange } from "@/lib/store/notifications"
import { releaseCouponClaimForOrder } from "@/lib/store/coupon-claims"
import { logAudit } from "@/lib/audit-log"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, adherent: { select: { id: true, nom: true, prenoms: true } } },
  })
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }
  return NextResponse.json({ order })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params

  const body = await request.json()
  const parsed = orderStatusUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }
  const { status: nextStatus } = parsed.data

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  if (!canTransition(order.status, nextStatus)) {
    return NextResponse.json(
      { error: `Transition ${order.status} → ${nextStatus} non autorisée` },
      { status: 409 }
    )
  }

  // CAS : évite un double traitement (stock relâché/remboursé deux fois) si
  // la même action est envoyée deux fois (double-clic, requêtes concurrentes).
  const claimed = await prisma.order.updateMany({
    where: { id, status: order.status },
    data: {
      status: nextStatus,
      ...(nextStatus === "REFUNDED" && { paymentStatus: "REFUNDED" }),
      ...(nextStatus === "CANCELLED" && order.paymentStatus === "UNPAID" && { paymentStatus: "UNPAID" }),
    },
  })
  if (claimed.count === 0) {
    return NextResponse.json({ error: "Commande déjà modifiée entre-temps" }, { status: 409 })
  }

  if (nextStatus === "CANCELLED") {
    // La commande n'a jamais été payée (seule transition possible depuis
    // PENDING) : le stock n'a été que réservé, jamais réellement décrémenté.
    await releaseCouponClaimForOrder(order)
    for (const item of order.items) {
      if (!item.productId) continue
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { reserved: { decrement: item.quantity } },
        })
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { reserved: { decrement: item.quantity } },
        })
      }
      await prisma.inventoryTransaction.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          type: "RELEASE",
          quantity: item.quantity,
          reason: `Commande ${order.orderNumber} annulée`,
          orderId: order.id,
          adminId: session.id,
        },
      })
    }
  }

  if (nextStatus === "REFUNDED") {
    // Le paiement avait réussi : le stock avait été réellement décrémenté
    // (voir completeStoreOrderByToken). On le restitue.
    for (const item of order.items) {
      if (!item.productId) continue
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      await prisma.inventoryTransaction.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          type: "RETURN",
          quantity: item.quantity,
          reason: `Commande ${order.orderNumber} remboursée`,
          orderId: order.id,
          adminId: session.id,
        },
      })
    }
  }

  await logAudit(
    session,
    "store.order_status_change",
    "Order",
    id,
    `${order.orderNumber} : ${order.status} → ${nextStatus}`
  )

  if (nextStatus === "READY" || nextStatus === "SHIPPED" || nextStatus === "DELIVERED" || nextStatus === "REFUNDED") {
    try {
      await notifyOrderStatusChange(order, nextStatus)
    } catch (e) {
      console.error("notifyOrderStatusChange", e)
    }
  }

  const updated = await prisma.order.findUnique({ where: { id }, include: { items: true } })
  return NextResponse.json({ ok: true, order: updated })
}
