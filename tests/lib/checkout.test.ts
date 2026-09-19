import { describe, it, expect, beforeEach, vi } from "vitest"
import { prisma } from "@/lib/db"
import { resetStoreTables, createTestProduct, rid } from "../helpers"

// PayDunya n'est JAMAIS appelé réellement dans les tests — mode "live" en
// production, un vrai appel dépenserait de l'argent réel ou polluerait le
// tableau de bord marchand. Le comportement testé ici est tout ce qui se
// passe autour de cet appel (réservation de stock, coupon, idempotence).
vi.mock("@/lib/paydunya", () => ({
  paydunyaConfigured: () => true,
  createCheckoutInvoice: vi.fn(async () => ({
    // Un token unique par appel — Order.paymentToken est @unique, une valeur
    // fixe ferait échouer tout test créant plusieurs commandes réelles.
    token: `fake-token-${Math.random().toString(36).slice(2)}`,
    url: "https://example.test/fake-invoice",
  })),
  confirmCheckoutInvoice: vi.fn(async () => ({ status: "completed" as const, raw: {} })),
}))

// getMemberSession() utilise next/headers cookies(), indisponible hors
// contexte de requête Next.js réel — simulé "non connecté" par défaut.
vi.mock("@/lib/member-auth", () => ({
  getMemberSession: vi.fn(async () => null),
}))

const { createCheckoutInvoice, confirmCheckoutInvoice } = await import("@/lib/paydunya")
const { createStoreOrder, completeStoreOrderByToken, CheckoutError } = await import("@/lib/store/checkout")

describe("createStoreOrder", () => {
  beforeEach(async () => {
    await resetStoreTables()
    vi.mocked(createCheckoutInvoice).mockClear()
    vi.mocked(confirmCheckoutInvoice).mockClear()
  })

  it("calcule le total depuis les prix réels en base, jamais un prix envoyé par le client", async () => {
    const product = await createTestProduct({ price: 2500, stock: 10 })

    const result = await createStoreOrder({
      items: [{ productId: product.id, variantId: null, quantity: 2 }],
      customerName: "Cliente Test",
      customerPhone: "+221771112233",
      shippingZone: "retrait",
    })

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId }, include: { items: true } })
    expect(order.subtotal).toBe(5000) // 2500 x 2 — jamais un montant fourni par l'appelant
    expect(order.items[0].unitPrice).toBe(2500)
    expect(order.total).toBe(5000)
  })

  it("réserve le stock (reserved += quantity) sans jamais le décrémenter avant paiement", async () => {
    const product = await createTestProduct({ price: 1000, stock: 20, reserved: 0 })

    await createStoreOrder({
      items: [{ productId: product.id, variantId: null, quantity: 3 }],
      customerName: "Cliente",
      customerPhone: "+221771112233",
      shippingZone: "retrait",
    })

    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.reserved).toBe(3)
    expect(fresh.stock).toBe(20) // stock réel inchangé tant que non payé
  })

  it("rejette si le stock disponible est insuffisant, sans créer de commande", async () => {
    const product = await createTestProduct({ price: 1000, stock: 2 })

    await expect(
      createStoreOrder({
        items: [{ productId: product.id, variantId: null, quantity: 5 }],
        customerName: "Cliente",
        customerPhone: "+221771112233",
        shippingZone: "retrait",
      })
    ).rejects.toThrow(CheckoutError)

    const orders = await prisma.order.count()
    expect(orders).toBe(0)
  })

  it("précommande : accepte une commande même à stock épuisé, la réservation dépasse le stock réel", async () => {
    const product = await createTestProduct({ price: 1000, stock: 0, preorder: true })

    const result = await createStoreOrder({
      items: [{ productId: product.id, variantId: null, quantity: 3 }],
      customerName: "Cliente",
      customerPhone: "+221771112233",
      shippingZone: "retrait",
    })

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } })
    expect(order.total).toBe(3000)
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.reserved).toBe(3) // dépasse stock=0, accepté car preorder
  })

  it("précommande sur une variante : la portée est le produit parent, pas la variante elle-même", async () => {
    const product = await createTestProduct({ price: 1000, preorder: true })
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, label: "Unique", attributes: "{}", sku: rid("VAR"), stock: 0 },
    })

    const result = await createStoreOrder({
      items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
      customerName: "Cliente",
      customerPhone: "+221771112233",
      shippingZone: "retrait",
    })

    expect(result.orderId).toBeTruthy()
    const freshVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })
    expect(freshVariant.reserved).toBe(2)
  })

  it("régression : si un article échoue, la réservation des articles précédents de la même commande est relâchée", async () => {
    const ok = await createTestProduct({ name: "Disponible", price: 1000, stock: 10 })
    const short = await createTestProduct({ name: "Stock insuffisant", price: 1000, stock: 1 })

    await expect(
      createStoreOrder({
        items: [
          { productId: ok.id, variantId: null, quantity: 2 }, // passe
          { productId: short.id, variantId: null, quantity: 5 }, // échoue
        ],
        customerName: "Cliente",
        customerPhone: "+221771112233",
        shippingZone: "retrait",
      })
    ).rejects.toThrow(CheckoutError)

    const freshOk = await prisma.product.findUniqueOrThrow({ where: { id: ok.id } })
    expect(freshOk.reserved).toBe(0) // la réservation du 1er article a bien été annulée
  })

  it("rejette un produit inactif", async () => {
    const product = await createTestProduct({ active: false })
    await expect(
      createStoreOrder({
        items: [{ productId: product.id, variantId: null, quantity: 1 }],
        customerName: "Cliente",
        customerPhone: "+221771112233",
        shippingZone: "retrait",
      })
    ).rejects.toThrow(CheckoutError)
  })

  it("rejette silencieusement une requête avec le champ honeypot rempli", async () => {
    const product = await createTestProduct()
    await expect(
      createStoreOrder({
        items: [{ productId: product.id, variantId: null, quantity: 1 }],
        customerName: "Bot",
        customerPhone: "+221771112233",
        shippingZone: "retrait",
        website: "http://spam.example",
      })
    ).rejects.toThrow(CheckoutError)
    expect(vi.mocked(createCheckoutInvoice)).not.toHaveBeenCalled()
  })

  it("applique une réduction de coupon valide au total", async () => {
    // Toujours stocké en majuscules — même normalisation que la vraie route
    // admin (POST /api/store/admin/coupons) ; validateCoupon uppercase aussi
    // le code reçu avant de chercher en base.
    const coupon = await prisma.coupon.create({
      data: { code: rid("PROMO").toUpperCase(), type: "PERCENTAGE", value: 10, active: true },
    })
    const product = await createTestProduct({ price: 1000, stock: 10 })

    const result = await createStoreOrder({
      items: [{ productId: product.id, variantId: null, quantity: 1 }],
      customerName: "Cliente",
      customerPhone: "+221771112233",
      shippingZone: "retrait",
      couponCode: coupon.code,
    })

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } })
    expect(order.discount).toBe(100)
    expect(order.total).toBe(900)
  })

  it("rejette un code coupon invalide (la commande n'est pas créée, le stock n'est pas réservé)", async () => {
    const product = await createTestProduct({ stock: 5 })
    await expect(
      createStoreOrder({
        items: [{ productId: product.id, variantId: null, quantity: 1 }],
        customerName: "Cliente",
        customerPhone: "+221771112233",
        shippingZone: "retrait",
        couponCode: "CODEQUINEXISTEPAS",
      })
    ).rejects.toThrow(CheckoutError)

    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.reserved).toBe(0)
  })

  // Audit sécurité 2026 (V-07) : la réservation atomique du coupon doit être
  // intégrée à createStoreOrder lui-même, pas seulement testable en isolation
  // dans coupon-claims.test.ts — sinon un mauvais branchement passerait
  // inaperçu malgré des unités qui passent.
  it("un coupon maxUses=1 rejette la 2e commande, même sans concurrence réelle", async () => {
    const coupon = await prisma.coupon.create({
      data: { code: rid("UNIQUE").toUpperCase(), type: "PERCENTAGE", value: 10, active: true, maxUses: 1 },
    })
    const product = await createTestProduct({ price: 1000, stock: 10 })

    const first = await createStoreOrder({
      items: [{ productId: product.id, variantId: null, quantity: 1 }],
      customerName: "Cliente A",
      customerPhone: "+221771112233",
      shippingZone: "retrait",
      couponCode: coupon.code,
    })
    expect(first.orderId).toBeTruthy()

    await expect(
      createStoreOrder({
        items: [{ productId: product.id, variantId: null, quantity: 1 }],
        customerName: "Cliente B",
        customerPhone: "+221779998877",
        shippingZone: "retrait",
        couponCode: coupon.code,
      })
    ).rejects.toThrow(CheckoutError)

    // Le stock de la 2e tentative (rejetée après réservation du coupon)
    // doit avoir été relâché comme pour tout autre échec de commande.
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.reserved).toBe(1) // seule la commande de Cliente A reste réservée
  })

  it("annuler une commande relâche le coupon réservé pour un nouveau client", async () => {
    const coupon = await prisma.coupon.create({
      data: { code: rid("RELACHE").toUpperCase(), type: "PERCENTAGE", value: 10, active: true, maxUses: 1 },
    })
    const product = await createTestProduct({ price: 1000, stock: 10 })

    const first = await createStoreOrder({
      items: [{ productId: product.id, variantId: null, quantity: 1 }],
      customerName: "Cliente A",
      customerPhone: "+221771112233",
      shippingZone: "retrait",
      couponCode: coupon.code,
    })

    await prisma.order.update({ where: { id: first.orderId }, data: { status: "CANCELLED" } })
    const { releaseCouponClaimForOrder } = await import("@/lib/store/coupon-claims")
    const cancelled = await prisma.order.findUniqueOrThrow({ where: { id: first.orderId } })
    await releaseCouponClaimForOrder(cancelled)

    const freshCoupon = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } })
    expect(freshCoupon.claimedCount).toBe(0)

    const second = await createStoreOrder({
      items: [{ productId: product.id, variantId: null, quantity: 1 }],
      customerName: "Cliente B",
      customerPhone: "+221779998877",
      shippingZone: "retrait",
      couponCode: coupon.code,
    })
    expect(second.orderId).toBeTruthy()
  })
})

describe("completeStoreOrderByToken", () => {
  beforeEach(async () => {
    await resetStoreTables()
    vi.mocked(confirmCheckoutInvoice).mockReset()
  })

  it("décrémente stock et reserved (ensemble) uniquement quand le paiement est réellement confirmé", async () => {
    const product = await createTestProduct({ price: 1000, stock: 10, reserved: 2 })
    const order = await prisma.order.create({
      data: {
        orderNumber: rid("AK-TEST"),
        customerName: "Cliente",
        customerPhone: "+221771112233",
        subtotal: 2000,
        total: 2000,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentToken: "tok-completion-test",
        items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 2, subtotal: 2000 }] },
      },
    })
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "completed", raw: {} })

    const result = await completeStoreOrderByToken("tok-completion-test")
    expect(result.ok).toBe(true)

    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.stock).toBe(8) // 10 - 2
    expect(fresh.reserved).toBe(0) // 2 - 2

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(freshOrder.paymentStatus).toBe("PAID")
    expect(freshOrder.status).toBe("PROCESSING")
  })

  it("précommande payée : le stock devient négatif sans erreur, reserved retombe à 0", async () => {
    const product = await createTestProduct({ price: 1000, stock: 0, reserved: 3, preorder: true })
    await prisma.order.create({
      data: {
        orderNumber: rid("AK-TEST"),
        customerName: "Cliente",
        customerPhone: "+221771112233",
        subtotal: 3000,
        total: 3000,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentToken: "tok-preorder-test",
        items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 3, subtotal: 3000 }] },
      },
    })
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "completed", raw: {} })

    const result = await completeStoreOrderByToken("tok-preorder-test")

    expect(result.ok).toBe(true)
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.stock).toBe(-3) // attendu — régularisé au réapprovisionnement
    expect(fresh.reserved).toBe(0)
  })

  it("idempotent : deux confirmations concurrentes ne décrémentent le stock qu'une seule fois", async () => {
    const product = await createTestProduct({ price: 1000, stock: 10, reserved: 3 })
    await prisma.order.create({
      data: {
        orderNumber: rid("AK-TEST"),
        customerName: "Cliente",
        customerPhone: "+221771112233",
        subtotal: 3000,
        total: 3000,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentToken: "tok-idempotent-test",
        items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 3, subtotal: 3000 }] },
      },
    })
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "completed", raw: {} })

    await Promise.all(
      Array.from({ length: 5 }, () => completeStoreOrderByToken("tok-idempotent-test"))
    )

    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.stock).toBe(7) // 10 - 3, une seule fois malgré 5 appels
    expect(fresh.reserved).toBe(0)
  })

  it("régression : une confirmation tardive ne peut pas décrémenter le stock d'une commande déjà annulée", async () => {
    const product = await createTestProduct({ price: 1000, stock: 10, reserved: 0 })
    await prisma.order.create({
      data: {
        orderNumber: rid("AK-TEST"),
        customerName: "Cliente",
        customerPhone: "+221771112233",
        subtotal: 1000,
        total: 1000,
        status: "CANCELLED", // déjà annulée (admin ou libération automatique) — stock déjà relâché
        paymentStatus: "UNPAID",
        paymentToken: "tok-resurrection-test",
        items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 1, subtotal: 1000 }] },
      },
    })
    // PayDunya répond enfin "completed" bien après l'annulation (webhook en retard)
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "completed", raw: {} })

    const result = await completeStoreOrderByToken("tok-resurrection-test")

    // PayDunya dit bien "completed" (result.ok reflète son statut externe),
    // mais le CAS interne n'a pas pu s'appliquer : la commande reste annulée.
    expect(result.order?.status).toBe("CANCELLED")
    expect(result.order?.paymentStatus).toBe("UNPAID")
    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.stock).toBe(10) // pas décrémenté une deuxième fois
    expect(fresh.reserved).toBe(0)
  })

  it("une commande annulée/refusée relâche la réservation sans jamais toucher au stock réel", async () => {
    const product = await createTestProduct({ price: 1000, stock: 10, reserved: 1 })
    await prisma.order.create({
      data: {
        orderNumber: rid("AK-TEST"),
        customerName: "Cliente",
        customerPhone: "+221771112233",
        subtotal: 1000,
        total: 1000,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentToken: "tok-failed-test",
        items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 1, subtotal: 1000 }] },
      },
    })
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "failed", raw: {} })

    await completeStoreOrderByToken("tok-failed-test")

    const fresh = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(fresh.reserved).toBe(0)
    expect(fresh.stock).toBe(10) // jamais décrémenté pour un paiement raté
  })
})
