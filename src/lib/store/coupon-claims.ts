import { prisma } from "@/lib/db"

/**
 * Réserve un usage de coupon de façon atomique (CAS via updateMany
 * conditionnel), même principe que la réservation de stock dans
 * checkout.ts — jamais un simple count() suivi d'un create(), qui laisse
 * une fenêtre de concurrence permettant de dépasser maxUses/usesPerCustomer
 * (audit sécurité 2026). Retourne false si le plafond est atteint.
 */
export async function claimCoupon(
  couponId: string,
  customerPhone: string,
  maxUses: number | null,
  usesPerCustomer: number | null
): Promise<boolean> {
  if (maxUses !== null) {
    const globalClaim = await prisma.coupon.updateMany({
      where: { id: couponId, claimedCount: { lt: maxUses } },
      data: { claimedCount: { increment: 1 } },
    })
    if (globalClaim.count === 0) return false
  } else {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { claimedCount: { increment: 1 } },
    })
  }

  if (usesPerCustomer !== null) {
    // Garantit l'existence de la ligne compteur (upsert atomique côté
    // SQLite via ON CONFLICT) avant la réservation CAS elle-même.
    await prisma.couponClaim.upsert({
      where: { couponId_customerPhone: { couponId, customerPhone } },
      create: { couponId, customerPhone, count: 0 },
      update: {},
    })
    const perCustomerClaim = await prisma.couponClaim.updateMany({
      where: { couponId, customerPhone, count: { lt: usesPerCustomer } },
      data: { count: { increment: 1 } },
    })
    if (perCustomerClaim.count === 0) {
      // Plafond global disponible mais plafond par client atteint —
      // annule la réservation globale prise juste au-dessus.
      await prisma.coupon.update({
        where: { id: couponId },
        data: { claimedCount: { decrement: 1 } },
      })
      return false
    }
  }

  return true
}

/** Relâche une réservation (commande annulée/expirée avant paiement). */
export async function releaseCouponClaim(couponId: string, customerPhone: string) {
  await prisma.coupon.update({
    where: { id: couponId },
    data: { claimedCount: { decrement: 1 } },
  })
  await prisma.couponClaim.updateMany({
    where: { couponId, customerPhone, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  })
}

/** Relâche la réservation d'une commande à partir de son couponCode — no-op si aucun coupon. */
export async function releaseCouponClaimForOrder(order: {
  couponCode: string | null
  customerPhone: string
}) {
  if (!order.couponCode) return
  const coupon = await prisma.coupon.findUnique({
    where: { code: order.couponCode },
    select: { id: true },
  })
  if (!coupon) return
  await releaseCouponClaim(coupon.id, order.customerPhone)
}
