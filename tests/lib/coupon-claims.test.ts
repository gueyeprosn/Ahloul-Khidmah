import { describe, it, expect, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { claimCoupon, releaseCouponClaim, releaseCouponClaimForOrder } from "@/lib/store/coupon-claims"
import { resetStoreTables, rid } from "../helpers"

async function makeCoupon(overrides: Partial<{ maxUses: number | null; usesPerCustomer: number | null }> = {}) {
  return prisma.coupon.create({
    data: {
      code: rid("CPN"),
      type: "PERCENTAGE",
      value: 10,
      active: true,
      maxUses: overrides.maxUses ?? null,
      usesPerCustomer: overrides.usesPerCustomer ?? null,
    },
  })
}

describe("claimCoupon / releaseCouponClaim", () => {
  beforeEach(async () => {
    await resetStoreTables()
  })

  it("réserve sans limite quand maxUses et usesPerCustomer sont null", async () => {
    const coupon = await makeCoupon()
    const claimed = await claimCoupon(coupon.id, "+221770000001", null, null)
    expect(claimed).toBe(true)
    const fresh = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })
    expect(fresh.claimedCount).toBe(1)
  })

  it("refuse la réservation une fois maxUses atteint (globalement, tous clients confondus)", async () => {
    const coupon = await makeCoupon({ maxUses: 2 })
    expect(await claimCoupon(coupon.id, "+221770000001", 2, null)).toBe(true)
    expect(await claimCoupon(coupon.id, "+221770000002", 2, null)).toBe(true)
    expect(await claimCoupon(coupon.id, "+221770000003", 2, null)).toBe(false)
    const fresh = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })
    expect(fresh.claimedCount).toBe(2)
  })

  it("refuse une 2e réservation du même client une fois usesPerCustomer atteint", async () => {
    const coupon = await makeCoupon({ usesPerCustomer: 1 })
    expect(await claimCoupon(coupon.id, "+221770000001", null, 1)).toBe(true)
    expect(await claimCoupon(coupon.id, "+221770000001", null, 1)).toBe(false)
    // Un autre client reste autorisé.
    expect(await claimCoupon(coupon.id, "+221770000002", null, 1)).toBe(true)
  })

  it("plafond global disponible mais plafond client atteint : annule la réservation globale prise entre-temps", async () => {
    const coupon = await makeCoupon({ maxUses: 10, usesPerCustomer: 1 })
    expect(await claimCoupon(coupon.id, "+221770000001", 10, 1)).toBe(true)
    expect(await claimCoupon(coupon.id, "+221770000001", 10, 1)).toBe(false)
    // claimedCount ne doit pas être resté incrémenté par la tentative refusée.
    const fresh = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })
    expect(fresh.claimedCount).toBe(1)
  })

  it("concurrence : sur maxUses=1, une seule requête simultanée gagne (audit sécurité V-07)", async () => {
    const coupon = await makeCoupon({ maxUses: 1 })
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => claimCoupon(coupon.id, `+22177000${String(i).padStart(4, "0")}`, 1, null))
    )
    expect(results.filter(Boolean)).toHaveLength(1)
    const fresh = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })
    expect(fresh.claimedCount).toBe(1)
  })

  it("concurrence : sur usesPerCustomer=1, un seul essai du même client gagne malgré des requêtes simultanées", async () => {
    const coupon = await makeCoupon({ usesPerCustomer: 1 })
    const results = await Promise.all(
      Array.from({ length: 10 }, () => claimCoupon(coupon.id, "+221770000099", null, 1))
    )
    expect(results.filter(Boolean)).toHaveLength(1)
  })

  it("releaseCouponClaim rend le slot disponible pour une nouvelle réservation", async () => {
    const coupon = await makeCoupon({ maxUses: 1, usesPerCustomer: 1 })
    expect(await claimCoupon(coupon.id, "+221770000001", 1, 1)).toBe(true)
    expect(await claimCoupon(coupon.id, "+221770000002", 1, 1)).toBe(false)

    await releaseCouponClaim(coupon.id, "+221770000001")

    const fresh = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })
    expect(fresh.claimedCount).toBe(0)
    expect(await claimCoupon(coupon.id, "+221770000002", 1, 1)).toBe(true)
  })

  it("releaseCouponClaimForOrder est un no-op si la commande n'a pas de coupon", async () => {
    await expect(
      releaseCouponClaimForOrder({ couponCode: null, customerPhone: "+221770000001" })
    ).resolves.toBeUndefined()
  })

  it("releaseCouponClaimForOrder retrouve le coupon par son code et relâche la réservation", async () => {
    const coupon = await makeCoupon({ maxUses: 1 })
    await claimCoupon(coupon.id, "+221770000001", 1, null)

    await releaseCouponClaimForOrder({ couponCode: coupon.code, customerPhone: "+221770000001" })

    const fresh = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })
    expect(fresh.claimedCount).toBe(0)
  })
})
