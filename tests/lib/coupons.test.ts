import { describe, it, expect, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { validateCoupon } from "@/lib/store/coupons"
import { resetStoreTables, createTestProduct, createTestOrder, rid } from "../helpers"

describe("validateCoupon", () => {
  beforeEach(async () => {
    await resetStoreTables()
  })

  it("pourcentage : calcule correctement la réduction", async () => {
    await prisma.coupon.create({ data: { code: "WELCOME10", type: "PERCENTAGE", value: 10, active: true } })
    const r = await validateCoupon({ code: "WELCOME10", subtotal: 10000, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.discountAmount).toBe(1000)
  })

  it("montant fixe : rejette si le sous-total est sous le minimum requis", async () => {
    await prisma.coupon.create({
      data: { code: "MOINS500", type: "FIXED_AMOUNT", value: 500, minOrderAmount: 2000, active: true },
    })
    const r = await validateCoupon({ code: "MOINS500", subtotal: 1500, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(false)
  })

  it("montant fixe : accepté une fois le minimum atteint", async () => {
    await prisma.coupon.create({
      data: { code: "MOINS500B", type: "FIXED_AMOUNT", value: 500, minOrderAmount: 2000, active: true },
    })
    const r = await validateCoupon({ code: "MOINS500B", subtotal: 3000, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.discountAmount).toBe(500)
  })

  it("montant fixe : jamais de réduction supérieure au sous-total (total jamais négatif)", async () => {
    await prisma.coupon.create({ data: { code: "GROSMONTANT", type: "FIXED_AMOUNT", value: 999999, active: true } })
    const r = await validateCoupon({ code: "GROSMONTANT", subtotal: 1500, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.discountAmount).toBe(1500)
  })

  it("livraison gratuite : freeShipping=true, aucune réduction de montant", async () => {
    await prisma.coupon.create({ data: { code: "LIVRAISONGRATUITE", type: "FREE_SHIPPING", active: true } })
    const r = await validateCoupon({ code: "LIVRAISONGRATUITE", subtotal: 5000, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.freeShipping).toBe(true)
      expect(r.discountAmount).toBe(0)
    }
  })

  it("rejette un coupon expiré", async () => {
    await prisma.coupon.create({
      data: { code: "EXPIRE2020", type: "PERCENTAGE", value: 50, active: true, endsAt: new Date("2020-01-01") },
    })
    const r = await validateCoupon({ code: "EXPIRE2020", subtotal: 5000, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(false)
  })

  it("rejette un coupon désactivé", async () => {
    await prisma.coupon.create({ data: { code: "DESACTIVE", type: "PERCENTAGE", value: 20, active: false } })
    const r = await validateCoupon({ code: "DESACTIVE", subtotal: 5000, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(false)
  })

  it("rejette un code inexistant", async () => {
    const r = await validateCoupon({ code: "NEXISTEPAS", subtotal: 5000, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(false)
  })

  it("réservé aux membres : rejette un non-membre", async () => {
    await prisma.coupon.create({ data: { code: "MEMBRES", type: "PERCENTAGE", value: 15, active: true, membersOnly: true } })
    const r = await validateCoupon({ code: "MEMBRES", subtotal: 5000, customerPhone: "+221770000001", isMember: false })
    expect(r.ok).toBe(false)
  })

  it("réservé aux membres : accepte un membre connecté", async () => {
    await prisma.coupon.create({ data: { code: "MEMBRES2", type: "PERCENTAGE", value: 15, active: true, membersOnly: true } })
    const r = await validateCoupon({ code: "MEMBRES2", subtotal: 5000, customerPhone: "+221770000001", isMember: true })
    expect(r.ok).toBe(true)
  })

  it("limite par client : bloque le même client après utilisation, laisse passer un autre", async () => {
    const coupon = await prisma.coupon.create({
      data: { code: "UNEFOIS", type: "FREE_SHIPPING", active: true, usesPerCustomer: 1 },
    })
    const product = await createTestProduct()
    const order = await createTestOrder({
      customerPhone: "+221770000099",
      couponCode: "UNEFOIS",
      status: "PROCESSING",
      paymentStatus: "PAID",
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1500, quantity: 1, subtotal: 1500 }] },
    })
    await prisma.couponUsage.create({
      data: { couponId: coupon.id, orderId: order.id, customerPhone: "+221770000099", discountAmount: 0 },
    })

    const sameCustomer = await validateCoupon({ code: "UNEFOIS", subtotal: 5000, customerPhone: "+221770000099", isMember: false })
    expect(sameCustomer.ok).toBe(false)

    const otherCustomer = await validateCoupon({ code: "UNEFOIS", subtotal: 5000, customerPhone: "+221770001111", isMember: false })
    expect(otherCustomer.ok).toBe(true)
  })

  it("limite globale (maxUses) : rejette une fois le total atteint", async () => {
    const coupon = await prisma.coupon.create({
      data: { code: rid("MAX1").toUpperCase(), type: "PERCENTAGE", value: 10, active: true, maxUses: 1 },
    })
    const product = await createTestProduct()
    const order = await createTestOrder({
      couponCode: coupon.code,
      status: "PROCESSING",
      paymentStatus: "PAID",
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1500, quantity: 1, subtotal: 1500 }] },
    })
    await prisma.couponUsage.create({
      data: { couponId: coupon.id, orderId: order.id, customerPhone: order.customerPhone, discountAmount: 150 },
    })

    const r = await validateCoupon({ code: coupon.code, subtotal: 5000, customerPhone: "+221779998888", isMember: false })
    expect(r.ok).toBe(false)
  })
})
