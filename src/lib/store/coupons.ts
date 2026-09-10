import { prisma } from "@/lib/db"

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"

export type CouponValidationResult =
  | { ok: true; couponId: string; discountAmount: number; freeShipping: boolean }
  | { ok: false; error: string }

/**
 * Revalide toujours entièrement côté serveur — jamais un montant de
 * réduction envoyé par le client. Utilisée à la fois pour l'aperçu (avant
 * commande) et pour l'application réelle (dans createStoreOrder), avec les
 * mêmes règles — aucune différence de confiance entre les deux appels.
 */
export async function validateCoupon(input: {
  code: string
  subtotal: number
  customerPhone: string
  isMember: boolean
}): Promise<CouponValidationResult> {
  const code = input.code.trim().toUpperCase()
  if (!code) return { ok: false, error: "Code requis" }

  const coupon = await prisma.coupon.findUnique({ where: { code } })
  if (!coupon || !coupon.active) {
    return { ok: false, error: "Code promo invalide" }
  }

  const now = new Date()
  if (coupon.startsAt && now < coupon.startsAt) {
    return { ok: false, error: "Ce code n'est pas encore actif" }
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return { ok: false, error: "Ce code a expiré" }
  }
  if (input.subtotal < coupon.minOrderAmount) {
    return {
      ok: false,
      error: `Montant minimum requis : ${coupon.minOrderAmount.toLocaleString("fr-FR")} FCFA`,
    }
  }
  if (coupon.membersOnly && !input.isMember) {
    return { ok: false, error: "Ce code est réservé aux membres connectés" }
  }

  if (coupon.maxUses !== null) {
    const totalUses = await prisma.couponUsage.count({ where: { couponId: coupon.id } })
    if (totalUses >= coupon.maxUses) {
      return { ok: false, error: "Ce code a atteint sa limite d'utilisation" }
    }
  }

  if (coupon.usesPerCustomer !== null) {
    const customerUses = await prisma.couponUsage.count({
      where: { couponId: coupon.id, customerPhone: input.customerPhone },
    })
    if (customerUses >= coupon.usesPerCustomer) {
      return { ok: false, error: "Vous avez déjà utilisé ce code" }
    }
  }

  let discountAmount = 0
  let freeShipping = false
  if (coupon.type === "PERCENTAGE") {
    discountAmount = Math.round((input.subtotal * Math.min(Math.max(coupon.value, 0), 100)) / 100)
  } else if (coupon.type === "FIXED_AMOUNT") {
    discountAmount = Math.min(coupon.value, input.subtotal)
  } else if (coupon.type === "FREE_SHIPPING") {
    freeShipping = true
  }

  return { ok: true, couponId: coupon.id, discountAmount, freeShipping }
}
