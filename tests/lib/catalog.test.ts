import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { prisma } from "@/lib/db"
import {
  availableStock,
  availabilityStatus,
  summarizeProduct,
  getCatalogProducts,
} from "@/lib/store/catalog"
import { resetStoreTables, createTestProduct, createTestCategory } from "../helpers"

describe("availableStock", () => {
  it("soustrait le stock réservé du stock total", () => {
    expect(availableStock({ stock: 10, reserved: 3 })).toBe(7)
  })
  it("ne descend jamais sous zéro même si reserved > stock (état incohérent)", () => {
    expect(availableStock({ stock: 2, reserved: 5 })).toBe(0)
  })
})

describe("availabilityStatus", () => {
  it("rupture quand le disponible est à 0", () => {
    expect(availabilityStatus(0, 5)).toBe("out_of_stock")
  })
  it("stock faible sous le seuil", () => {
    expect(availabilityStatus(3, 5)).toBe("low_stock")
  })
  it("en stock au-dessus du seuil", () => {
    expect(availabilityStatus(10, 5)).toBe("in_stock")
  })
})

describe("catalogue (avec base de test)", () => {
  beforeAll(async () => {
    await resetStoreTables()
  })
  afterAll(async () => {
    await resetStoreTables()
  })

  it("summarizeProduct calcule le prix min/max et la disponibilité sur les variantes", async () => {
    const product = await createTestProduct({
      price: 1000,
      lowStockThreshold: 5,
      variants: {
        create: [
          { label: "S", attributes: "{}", sku: "SUM-S", stock: 2, priceOverride: 900 },
          { label: "L", attributes: "{}", sku: "SUM-L", stock: 0, priceOverride: 1200 },
        ],
      },
    })
    const full = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        category: { select: { slug: true, name: true } },
        images: true,
        variants: { where: { active: true } },
      },
    })
    const summary = summarizeProduct(full)
    expect(summary.minPrice).toBe(900)
    expect(summary.maxPrice).toBe(1200)
    expect(summary.priceIsRange).toBe(true)
    // 2 (variante S) + 0 (variante L) = 2 disponibles, sous le seuil 5 → low_stock
    expect(summary.totalAvailable).toBe(2)
    expect(summary.availability).toBe("low_stock")
  })

  it("un produit inactif n'apparaît jamais dans le catalogue public", async () => {
    await createTestProduct({ name: "Produit actif visible", active: true })
    await createTestProduct({ name: "Produit archivé invisible", active: false })

    const { products } = await getCatalogProducts({})
    expect(products.some((p) => p.name === "Produit actif visible")).toBe(true)
    expect(products.some((p) => p.name === "Produit archivé invisible")).toBe(false)
  })

  it("filtre par catégorie", async () => {
    const cat = await createTestCategory({ name: "Filtrage" })
    const inCat = await createTestProduct({ name: "Dans la catégorie", categoryId: cat.id })
    await createTestProduct({ name: "Hors catégorie" })

    const { products, total } = await getCatalogProducts({ categorySlug: cat.slug })
    expect(total).toBe(1)
    expect(products[0].id).toBe(inCat.id)
  })

  it("filtre par promotion (compareAtPrice renseigné)", async () => {
    await createTestProduct({ name: "En promo", price: 1000, compareAtPrice: 1500 })
    await createTestProduct({ name: "Prix normal", price: 1000 })

    const { products } = await getCatalogProducts({ promo: true })
    expect(products.every((p) => p.compareAtPrice !== null)).toBe(true)
    expect(products.some((p) => p.name === "En promo")).toBe(true)
    expect(products.some((p) => p.name === "Prix normal")).toBe(false)
  })

  it("trie par prix croissant", async () => {
    await createTestProduct({ name: "Cher", price: 5000 })
    await createTestProduct({ name: "Pas cher", price: 500 })

    const { products } = await getCatalogProducts({ sort: "prix_asc" })
    const prices = products.map((p) => p.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })
})
