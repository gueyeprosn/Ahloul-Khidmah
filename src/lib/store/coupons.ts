import { prisma } from "@/lib/db"

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"

export type CouponValidationResult =
  | {
      ok: true
      couponId: string
      discountAmount: number
      freeShipping: boolean
      maxUses: number | null
      usesPerCustomer: number | null
    }
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

  // Vérifie contre les compteurs de réservation atomiques (claimedCount /
  // CouponClaim), pas CouponUsage (qui ne trace que le payé) — un aperçu
  // qui ignorerait les commandes en cours de paiement laisserait passer
  // plus de monde que maxUses ne l'autorise réellement à la validation
  // finale (voir claimCoupon dans coupon-claims.ts).
  if (coupon.maxUses !== null && coupon.claimedCount >= coupon.maxUses) {
    return { ok: false, error: "Ce code a atteint sa limite d'utilisation" }
  }

  if (coupon.usesPerCustomer !== null) {
    const claim = await prisma.couponClaim.findUnique({
      where: { couponId_customerPhone: { couponId: coupon.id, customerPhone: input.customerPhone } },
    })
    if (claim && claim.count >= coupon.usesPerCustomer) {
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

  return {
    ok: true,
    couponId: coupon.id,
    discountAmount,
    freeShipping,
    maxUses: coupon.maxUses,
    usesPerCustomer: coupon.usesPerCustomer,
  }
}
