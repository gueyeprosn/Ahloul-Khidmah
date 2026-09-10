import { prisma } from "@/lib/db"
import {
  confirmCheckoutInvoice,
  createCheckoutInvoice,
  paydunyaConfigured,
} from "@/lib/paydunya"
import { createOrderWithNumber } from "@/lib/store/order-number"
import { notifyOrderPaid } from "@/lib/store/notifications"
import { validateCoupon } from "@/lib/store/coupons"
import { getMemberSession } from "@/lib/member-auth"
import { shippingCostFor } from "@/features/store/shipping"
import type { StoreCheckoutInput } from "@/features/store/checkout-schema"

export class CheckoutError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

type ReservedLine = {
  productId: string
  variantId: string | null
  quantity: number
}

const MAX_RESERVE_ATTEMPTS = 8

/** Réserve atomiquement `quantity` unités (CAS sur `reserved`, retry si collision concurrente). */
async function reserveLine(productId: string, variantId: string | null, quantity: number) {
  for (let attempt = 1; attempt <= MAX_RESERVE_ATTEMPTS; attempt++) {
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, productId: true, active: true, stock: true, reserved: true, label: true },
      })
      if (!variant || variant.productId !== productId || !variant.active) {
        throw new CheckoutError("Option produit introuvable ou inactive", 404)
      }
      const available = variant.stock - variant.reserved
      if (available < quantity) {
        throw new CheckoutError(`Stock insuffisant (${variant.label})`, 409)
      }
      const claimed = await prisma.productVariant.updateMany({
        where: { id: variantId, reserved: variant.reserved },
        data: { reserved: variant.reserved + quantity },
      })
      if (claimed.count === 1) return
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, active: true, stock: true, reserved: true, name: true },
      })
      if (!product || !product.active) {
        throw new CheckoutError("Produit introuvable ou inactif", 404)
      }
      const available = product.stock - product.reserved
      if (available < quantity) {
        throw new CheckoutError(`Stock insuffisant (${product.name})`, 409)
      }
      const claimed = await prisma.product.updateMany({
        where: { id: productId, reserved: product.reserved },
        data: { reserved: product.reserved + quantity },
      })
      if (claimed.count === 1) return
    }
    await new Promise((r) => setTimeout(r, 10 + Math.random() * 30))
  }
  throw new CheckoutError("Trop de tentatives — réessayez", 409)
}

async function releaseLine(productId: string, variantId: string | null, quantity: number) {
  if (variantId) {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { reserved: { decrement: quantity } },
    })
  } else {
    await prisma.product.update({
      where: { id: productId },
      data: { reserved: { decrement: quantity } },
    })
  }
}

async function releaseAll(lines: ReservedLine[]) {
  for (const line of lines) {
    try {
      await releaseLine(line.productId, line.variantId, line.quantity)
    } catch (e) {
      console.error("releaseLine", e)
    }
  }
}

/**
 * Recalcule intégralement la commande côté serveur (jamais le prix/stock
 * envoyé par le client), réserve le stock, crée la commande + PayDunya.
 */
export async function createStoreOrder(input: StoreCheckoutInput) {
  if ((input.website ?? "").trim().length > 0) {
    throw new CheckoutError("Requête rejetée", 400)
  }
  if (!paydunyaConfigured()) {
    throw new CheckoutError("Paiement en ligne indisponible pour le moment", 503)
  }

  const reserved: ReservedLine[] = []
  const orderItemsData: {
    productId: string
    variantId: string | null
    productName: string
    sku: string
    unitPrice: number
    quantity: number
    subtotal: number
  }[] = []

  // Phase 1 : valider chaque ligne et réserver le stock. Tout échec ici (produit
  // introuvable/inactif, stock insuffisant...) relâche ce qui a déjà été réservé
  // par les lignes précédentes de cette même requête avant de remonter l'erreur.
  try {
    for (const line of input.items) {
      const product = await prisma.product.findUnique({
        where: { id: line.productId },
        select: { id: true, name: true, sku: true, price: true, active: true },
      })
      if (!product || !product.active) {
        throw new CheckoutError("Un produit de votre panier n'est plus disponible", 404)
      }

      let unitPrice = product.price
      let sku = product.sku
      if (line.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: line.variantId },
          select: { id: true, productId: true, active: true, priceOverride: true, sku: true, label: true },
        })
        if (!variant || variant.productId !== product.id || !variant.active) {
          throw new CheckoutError(`Option indisponible pour ${product.name}`, 404)
        }
        unitPrice = variant.priceOverride ?? product.price
        sku = variant.sku
      }

      await reserveLine(product.id, line.variantId ?? null, line.quantity)
      reserved.push({ productId: product.id, variantId: line.variantId ?? null, quantity: line.quantity })

      orderItemsData.push({
        productId: product.id,
        variantId: line.variantId ?? null,
        productName: product.name,
        sku,
        unitPrice,
        quantity: line.quantity,
        subtotal: unitPrice * line.quantity,
      })
    }
  } catch (e) {
    await releaseAll(reserved)
    throw e
  }

  const subtotal = orderItemsData.reduce((sum, i) => sum + i.subtotal, 0)
  let shippingCost = shippingCostFor(input.shippingZone)

  // Session membre : coupons membersOnly + lien Order.adherentId (jamais
  // un adherentId envoyé par le client).
  const memberSession = await getMemberSession()

  // Coupon : revalidé ici avec les mêmes règles que l'aperçu, jamais un
  // montant envoyé par le client. Un code invalide/expiré fait échouer la
  // commande (et relâche le stock réservé) plutôt que d'être ignoré en
  // silence — l'utilisateur doit savoir que sa réduction n'a pas été prise.
  let discount = 0
  let appliedCouponCode: string | null = null
  const couponCode = (input.couponCode || "").trim()
  if (couponCode) {
    const result = await validateCoupon({
      code: couponCode,
      subtotal,
      customerPhone: input.customerPhone,
      isMember: Boolean(memberSession),
    })
    if (!result.ok) {
      await releaseAll(reserved)
      throw new CheckoutError(result.error, 400)
    }
    discount = result.discountAmount
    if (result.freeShipping) shippingCost = 0
    appliedCouponCode = couponCode.toUpperCase()
  }

  const total = Math.max(subtotal + shippingCost - discount, 0)

  const shippingAddressJson =
    input.shippingZone !== "retrait" && input.shippingAddress
      ? JSON.stringify({
          line1: input.shippingAddress.line1.trim(),
          city: input.shippingAddress.city.trim(),
          landmark: (input.shippingAddress.landmark || "").trim() || undefined,
        })
      : null

  // Phase 2 : créer la commande. Si ça échoue, le stock réservé en phase 1
  // doit être relâché — rien n'existe encore pour le retenir.
  let order: Awaited<ReturnType<typeof createOrderWithNumber>>
  try {
    order = await createOrderWithNumber({
      adherentId: memberSession?.adherentId ?? null,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail || null,
      shippingZone: input.shippingZone,
      shippingAddress: shippingAddressJson,
      notes: input.notes || null,
      subtotal,
      shippingCost,
      discount,
      couponCode: appliedCouponCode,
      total,
      status: "PENDING",
      paymentStatus: "UNPAID",
      items: orderItemsData,
    })
  } catch (e) {
    await releaseAll(reserved)
    throw e
  }

  await Promise.all(
    reserved.map((line) =>
      prisma.inventoryTransaction.create({
        data: {
          productId: line.productId,
          variantId: line.variantId,
          type: "RESERVATION",
          quantity: -line.quantity,
          reason: `Commande ${order.orderNumber}`,
          orderId: order.id,
        },
      })
    )
  )

  // Phase 3 : facture PayDunya. Si ça échoue, la commande existe déjà — on la
  // marque annulée/échouée plutôt que de la supprimer (traçabilité), et on
  // relâche le stock réservé puisqu'aucun paiement n'a pu être initié.
  try {
    const invoice = await createCheckoutInvoice({
      amount: total,
      description: `Commande ${order.orderNumber} — Ahloul Khidmah Store`,
      paymentId: order.id,
      type: "boutique",
      customer: {
        name: input.customerName,
        email: input.customerEmail || undefined,
        phone: input.customerPhone,
      },
      returnPath: `/boutique/commande/${order.id}`,
      cancelPath: `/boutique/commande/${order.id}?annule=1`,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentToken: invoice.token, checkoutUrl: invoice.url },
    })

    return { orderId: order.id, orderNumber: order.orderNumber, url: invoice.url, token: invoice.token }
  } catch (e) {
    await releaseAll(reserved)
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    })
    throw e
  }
}

/** Complète (ou annule) une commande à partir du statut réel PayDunya — idempotent. */
export async function completeStoreOrderByToken(token: string) {
  const confirmed = await confirmCheckoutInvoice(token)
  const order = await prisma.order.findUnique({
    where: { paymentToken: token },
    include: { items: true },
  })
  if (!order) return { ok: false as const, status: confirmed.status, order: null }

  if (confirmed.status !== "completed") {
    if (confirmed.status === "canceled" || confirmed.status === "failed") {
      const claimed = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: "UNPAID" },
        data: {
          paymentStatus: confirmed.status === "canceled" ? "UNPAID" : "FAILED",
          status: "CANCELLED",
        },
      })
      if (claimed.count === 1) {
        await releaseAll(
          order.items.map((i) => ({
            productId: i.productId!,
            variantId: i.variantId,
            quantity: i.quantity,
          }))
        )
      }
    }
    const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } })
    return { ok: false as const, status: confirmed.status, order: fresh }
  }

  // CAS : un seul appel (webhook ou poll, arrivés en double) gagne la course.
  // status: "PENDING" en plus de paymentStatus: "UNPAID" — empêche une
  // confirmation tardive de "ressusciter" une commande déjà annulée (par un
  // admin ou par la libération automatique des réservations expirées, voir
  // lib/store/reservation-cleanup.ts) et de décrémenter le stock une
  // deuxième fois après qu'il a déjà été relâché.
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: "UNPAID", status: "PENDING" },
    data: { paymentStatus: "PAID", status: "PROCESSING" },
  })

  if (claimed.count === 1) {
    for (const item of order.items) {
      if (!item.productId) continue
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity }, reserved: { decrement: item.quantity } },
        })
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, reserved: { decrement: item.quantity } },
        })
      }
      await prisma.inventoryTransaction.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          type: "PURCHASE",
          quantity: -item.quantity,
          reason: `Commande ${order.orderNumber}`,
          orderId: order.id,
        },
      })
    }

    // Utilisation du coupon comptée seulement au paiement réel — une
    // commande abandonnée avant paiement ne doit jamais consommer un usage.
    if (order.couponCode) {
      try {
        const coupon = await prisma.coupon.findUnique({ where: { code: order.couponCode } })
        if (coupon) {
          await prisma.couponUsage.create({
            data: {
              couponId: coupon.id,
              orderId: order.id,
              customerPhone: order.customerPhone,
              discountAmount: order.discount,
            },
          })
        }
      } catch (e) {
        console.error("couponUsage", e)
      }
    }

    try {
      await notifyOrderPaid(order)
    } catch (e) {
      console.error("notifyOrderPaid", e)
    }
  }

  const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } })
  return { ok: true as const, status: "completed" as const, order: fresh }
}
