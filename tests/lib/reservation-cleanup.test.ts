import { describe, it, expect, beforeEach, vi } from "vitest"
import { prisma } from "@/lib/db"
import { resetStoreTables, createTestProduct, createTestOrder, rid } from "../helpers"

vi.mock("@/lib/paydunya", () => ({
  paydunyaConfigured: () => true,
  createCheckoutInvoice: vi.fn(),
  confirmCheckoutInvoice: vi.fn(),
}))

const { confirmCheckoutInvoice } = await import("@/lib/paydunya")
const { releaseStaleReservations } = await import("@/lib/store/reservation-cleanup")

const STALE = new Date(Date.now() - 60 * 60 * 1000) // 1h — au-delà du seuil de 45 min
const RECENT = new Date(Date.now() - 5 * 60 * 1000) // 5 min — sous le seuil

async function createStaleOrder(overrides: Parameters<typeof createTestOrder>[0] = {}) {
  return createTestOrder({ createdAt: STALE, paymentToken: rid("tok"), ...overrides })
}

describe("releaseStaleReservations", () => {
  beforeEach(async () => {
    await resetStoreTables()
    vi.mocked(confirmCheckoutInvoice).mockReset()
  })

  it("ignore les commandes récentes (moins de 45 minutes)", async () => {
    const product = await createTestProduct({ stock: 10, reserved: 2 })
    const order = await createTestOrder({
      createdAt: RECENT,
      paymentToken: rid("tok"),
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 2, subtotal: 2000 }] },
    })

    await releaseStaleReservations()

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    const freshProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(freshOrder.status).toBe("PENDING")
    expect(freshProduct.reserved).toBe(2) // toujours réservé, pas encore touché
  })

  it("force l'annulation et libère le stock si PayDunya répond encore 'pending' après 45 minutes", async () => {
    const product = await createTestProduct({ stock: 10, reserved: 3 })
    const order = await createStaleOrder({
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 3, subtotal: 3000 }] },
    })
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "pending", raw: {} })

    await releaseStaleReservations()

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    const freshProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(freshOrder.status).toBe("CANCELLED")
    expect(freshProduct.reserved).toBe(0)
    expect(freshProduct.stock).toBe(10) // jamais décrémenté — juste relâché

    const release = await prisma.inventoryTransaction.findFirst({ where: { orderId: order.id, type: "RELEASE" } })
    expect(release?.quantity).toBe(3)
  })

  it("relâche aussi une commande qui n'a jamais eu de facture PayDunya (paymentToken absent)", async () => {
    const product = await createTestProduct({ stock: 5, reserved: 1 })
    const order = await createTestOrder({
      createdAt: STALE,
      paymentToken: null,
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 1, subtotal: 1000 }] },
    })

    await releaseStaleReservations()

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(freshOrder.status).toBe("CANCELLED")
    expect(vi.mocked(confirmCheckoutInvoice)).not.toHaveBeenCalled()
  })

  it("sauve une commande en réalité payée : reconfirme et décrémente le stock réel plutôt que de l'annuler", async () => {
    const product = await createTestProduct({ stock: 10, reserved: 4 })
    const order = await createStaleOrder({
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 4, subtotal: 4000 }] },
    })
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "completed", raw: {} })

    await releaseStaleReservations()

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    const freshProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(freshOrder.paymentStatus).toBe("PAID")
    expect(freshOrder.status).toBe("PROCESSING")
    expect(freshProduct.stock).toBe(6) // 10 - 4, vraiment vendu
    expect(freshProduct.reserved).toBe(0)
  })

  it("ne relâche rien deux fois : deux balayages consécutifs restent sans effet le second passage", async () => {
    const product = await createTestProduct({ stock: 10, reserved: 2 })
    await createStaleOrder({
      items: { create: [{ productId: product.id, productName: product.name, sku: product.sku, unitPrice: 1000, quantity: 2, subtotal: 2000 }] },
    })
    vi.mocked(confirmCheckoutInvoice).mockResolvedValue({ status: "pending", raw: {} })

    await releaseStaleReservations()
    await releaseStaleReservations() // deuxième passage — la commande n'est plus PENDING

    const freshProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
    expect(freshProduct.reserved).toBe(0) // pas -2 une deuxième fois
  })
})
