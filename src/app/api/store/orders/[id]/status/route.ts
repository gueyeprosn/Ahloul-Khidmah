import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { completeStoreOrderByToken } from "@/lib/store/checkout"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(request)
  const limited = rateLimit(`store-order-status:${ip}`, 60, 5 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  const { id } = await context.params
  const orderId = String(id || "").slice(0, 64)

  let order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, paymentToken: true },
  })
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  if (order.paymentStatus === "UNPAID" && order.paymentToken) {
    try {
      const result = await completeStoreOrderByToken(order.paymentToken)
      if (result.order) {
        order = {
          id: result.order.id,
          orderNumber: result.order.orderNumber,
          status: result.order.status,
          paymentStatus: result.order.paymentStatus,
          total: result.order.total,
          paymentToken: result.order.paymentToken,
        }
      }
    } catch {
      /* ignore — poll suivant */
    }
  }

  return NextResponse.json({
    ok: true,
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.paymentStatus === "PAID" ? "completed" : order.status === "CANCELLED" ? "canceled" : "pending",
    paymentStatus: order.paymentStatus,
    total: order.total,
  })
}
