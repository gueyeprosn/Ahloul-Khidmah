import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

export type ProductAvailability = "in_stock" | "low_stock" | "out_of_stock" | "preorder"

type StockLike = {
  stock: number
  reserved: number
  lowStockThreshold?: number
}

/** Stock réellement vendable (réservations pour paniers/checkout en cours exclues). */
export function availableStock(item: StockLike): number {
  return Math.max(item.stock - item.reserved, 0)
}

/**
 * `preorderEnabled` vient de Product.preorder — reste commandable même à
 * stock épuisé, affiché "Précommande" au lieu de "Rupture de stock".
 */
export function availabilityStatus(
  totalAvailable: number,
  lowStockThreshold: number,
  preorderEnabled = false
): ProductAvailability {
  if (totalAvailable <= 0) return preorderEnabled ? "preorder" : "out_of_stock"
  if (totalAvailable <= lowStockThreshold) return "low_stock"
  return "in_stock"
}

export const catalogInclude = {
  category: { select: { slug: true, name: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { where: { active: true } },
}

type CatalogProduct = Awaited<ReturnType<typeof fetchOneProduct>>

async function fetchOneProduct(where: { slug: string } | { id: string }) {
  return prisma.product.findFirst({
    where: { ...where, active: true },
    include: catalogInclude,
  })
}

/** Résumé d'un produit pour la grille (carte) : prix affiché + disponibilité globale. */
export function summarizeProduct(
  product: NonNullable<CatalogProduct>
) {
  const hasVariants = product.variants.length > 0
  const prices = hasVariants
    ? product.variants.map((v) => v.priceOverride ?? product.price)
    : [product.price]
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const totalAvailable = hasVariants
    ? product.variants.reduce((sum, v) => sum + availableStock(v), 0)
    : availableStock(product)

  return {
    minPrice,
    maxPrice,
    priceIsRange: hasVariants && minPrice !== maxPrice,
    availability: availabilityStatus(totalAvailable, product.lowStockThreshold, product.preorder),
    totalAvailable,
    coverImage: product.images[0] ?? null,
  }
}

export async function getCatalogCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { active: true } } } },
    },
  })
}

export type CatalogSort = "pertinence" | "nouveautes" | "prix_asc" | "prix_desc"
export type CatalogAvailabilityFilter = "all" | "in_stock" | "low_stock"

const SORT_ORDER_BY: Record<CatalogSort, Prisma.ProductOrderByWithRelationInput[]> = {
  pertinence: [{ featured: "desc" }, { createdAt: "desc" }],
  nouveautes: [{ createdAt: "desc" }],
  prix_asc: [{ price: "asc" }],
  prix_desc: [{ price: "desc" }],
}

export async function getCatalogProducts(opts: {
  categorySlug?: string
  search?: string
  /** suggest = nom/SKU seulement (autocomplete) ; full = aussi description/catégorie */
  searchMode?: "suggest" | "full"
  minPrice?: number
  maxPrice?: number
  availability?: CatalogAvailabilityFilter
  promo?: boolean
  limitedEdition?: boolean
  isNew?: boolean
  sort?: CatalogSort
  take?: number
  skip?: number
} = {}) {
  const {
    categorySlug,
    minPrice,
    maxPrice,
    availability = "all",
    promo,
    limitedEdition,
    isNew,
    sort = "pertinence",
    take = 24,
    skip = 0,
    searchMode = "full",
  } = opts

  const search = opts.search?.trim()
  const searchOr =
    search && searchMode === "suggest"
      ? [
          { name: { contains: search } },
          { sku: { contains: search } },
        ]
      : search
        ? [
            { name: { contains: search } },
            { description: { contains: search } },
            { sku: { contains: search } },
            { category: { name: { contains: search } } },
          ]
        : null

  const where = {
    active: true,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
    ...(promo ? { compareAtPrice: { not: null } } : {}),
    ...(limitedEdition ? { limitedEdition: true } : {}),
    ...(isNew ? { isNew: true } : {}),
  }

  const boundedTake = Math.min(Math.max(take, 1), 60)

  function rankBySearchRelevance<T extends { name: string; sku: string }>(
    list: T[]
  ): T[] {
    if (!search) return list
    const q = search.toLowerCase()
    const score = (p: T) => {
      const name = p.name.toLowerCase()
      const sku = p.sku.toLowerCase()
      if (name === q || name.startsWith(`${q} `) || name.startsWith(q)) return 0
      if (name.includes(q)) return 1
      if (sku.includes(q)) return 2
      return 3
    }
    return [...list].sort((a, b) => score(a) - score(b))
  }

  // La disponibilité dépend du stock réservé (calculé, pas une colonne DB) :
  // impossible à filtrer/paginer par une requête Prisma classique. Le
  // catalogue reste de taille associative (dizaines de produits, jamais
  // des milliers), donc tout charger puis filtrer/paginer en mémoire reste
  // largement adapté — pas besoin d'une vraie pagination DB pour ce filtre.
  if (availability !== "all" || search) {
    const allMatching = await prisma.product.findMany({
      where,
      include: catalogInclude,
      orderBy: SORT_ORDER_BY[sort],
    })
    const ranked = rankBySearchRelevance(allMatching)
    const filtered =
      availability === "all"
        ? ranked
        : ranked.filter((p) => {
            const status = summarizeProduct(p).availability
            return availability === "in_stock"
              ? status !== "out_of_stock"
              : status === "low_stock"
          })
    return {
      products: filtered.slice(skip, skip + boundedTake),
      total: filtered.length,
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: catalogInclude,
      orderBy: SORT_ORDER_BY[sort],
      take: boundedTake,
      skip: Math.max(skip, 0),
    }),
    prisma.product.count({ where }),
  ])

  return { products, total }
}

export async function getProductBySlug(slug: string) {
  const product = await fetchOneProduct({ slug })
  if (!product) return null

  const related = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    include: catalogInclude,
    orderBy: { featured: "desc" },
    take: 4,
  })

  return { product, related }
}
