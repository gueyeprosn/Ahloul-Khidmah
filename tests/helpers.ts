import { prisma } from "@/lib/db"

/** Suffixe aléatoire pour des identifiants uniques par test (mêmes fixtures que les scripts ad hoc utilisés pendant le développement). */
export function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

/** Vide les tables boutique dans l'ordre compatible FK — appelée en début de fichier de test, jamais en production (garde-fou dans setup.ts). */
export async function resetStoreTables() {
  await prisma.review.deleteMany()
  await prisma.couponUsage.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.inventoryTransaction.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
}

export async function createTestCategory(overrides: Partial<Parameters<typeof prisma.category.create>[0]["data"]> = {}) {
  return prisma.category.create({
    data: {
      slug: rid("cat"),
      name: "Catégorie test",
      ...overrides,
    },
  })
}

export async function createTestProduct(
  overrides: Partial<Parameters<typeof prisma.product.create>[0]["data"]> = {}
) {
  return prisma.product.create({
    data: {
      slug: rid("produit"),
      sku: rid("SKU").toUpperCase(),
      name: "Produit test",
      description: "Description de test.",
      price: 1500,
      stock: 100,
      active: true,
      ...overrides,
    },
  })
}

export async function createTestOrder(
  overrides: Partial<Parameters<typeof prisma.order.create>[0]["data"]> = {}
) {
  return prisma.order.create({
    data: {
      orderNumber: rid("AK-TEST"),
      customerName: "Cliente Test",
      customerPhone: "+221770000000",
      subtotal: 1500,
      total: 1500,
      status: "PENDING",
      paymentStatus: "UNPAID",
      ...overrides,
    },
  })
}
