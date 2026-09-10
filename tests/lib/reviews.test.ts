import { describe, it, expect, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { displayReviewerName, getApprovedReviews, getReviewStats } from "@/lib/store/reviews"
import { resetStoreTables, createTestProduct, createTestOrder } from "../helpers"

describe("displayReviewerName", () => {
  it("garde le prénom, réduit le nom à son initiale", () => {
    expect(displayReviewerName("Fatou Diop")).toBe("Fatou D.")
  })
  it("gère un nom composé de plusieurs mots (garde le dernier comme nom)", () => {
    expect(displayReviewerName("Amadou Cheikh Ba")).toBe("Amadou B.")
  })
  it("laisse un nom seul inchangé", () => {
    expect(displayReviewerName("Fatou")).toBe("Fatou")
  })
})

describe("avis produit (avec base de test)", () => {
  beforeEach(async () => {
    await resetStoreTables()
  })

  it("seuls les avis APPROVED sont retournés publiquement", async () => {
    const product = await createTestProduct()
    const order1 = await createTestOrder({ status: "PROCESSING", paymentStatus: "PAID" })
    const order2 = await createTestOrder({ status: "PROCESSING", paymentStatus: "PAID" })
    const order3 = await createTestOrder({ status: "PROCESSING", paymentStatus: "PAID" })

    await prisma.review.create({
      data: { productId: product.id, orderId: order1.id, customerName: "A", customerPhone: "1", rating: 5, comment: "Approuvé", status: "APPROVED" },
    })
    await prisma.review.create({
      data: { productId: product.id, orderId: order2.id, customerName: "B", customerPhone: "2", rating: 3, comment: "En attente", status: "PENDING" },
    })
    await prisma.review.create({
      data: { productId: product.id, orderId: order3.id, customerName: "C", customerPhone: "3", rating: 1, comment: "Rejeté", status: "REJECTED" },
    })

    const reviews = await getApprovedReviews(product.id)
    expect(reviews).toHaveLength(1)
    expect(reviews[0].comment).toBe("Approuvé")
  })

  it("getReviewStats calcule la moyenne uniquement sur les avis approuvés", async () => {
    const product = await createTestProduct()
    const orderA = await createTestOrder({ status: "PROCESSING", paymentStatus: "PAID" })
    const orderB = await createTestOrder({ status: "PROCESSING", paymentStatus: "PAID" })
    const orderC = await createTestOrder({ status: "PROCESSING", paymentStatus: "PAID" })

    await prisma.review.create({
      data: { productId: product.id, orderId: orderA.id, customerName: "A", customerPhone: "1", rating: 5, comment: "x", status: "APPROVED" },
    })
    await prisma.review.create({
      data: { productId: product.id, orderId: orderB.id, customerName: "B", customerPhone: "2", rating: 3, comment: "x", status: "APPROVED" },
    })
    await prisma.review.create({
      data: { productId: product.id, orderId: orderC.id, customerName: "C", customerPhone: "3", rating: 1, comment: "x", status: "PENDING" },
    })

    const stats = await getReviewStats(product.id)
    expect(stats.count).toBe(2)
    expect(stats.average).toBe(4) // (5+3)/2, le PENDING est exclu
  })

  it("un produit sans avis renvoie une moyenne à 0", async () => {
    const product = await createTestProduct()
    const stats = await getReviewStats(product.id)
    expect(stats.count).toBe(0)
    expect(stats.average).toBe(0)
  })
})
