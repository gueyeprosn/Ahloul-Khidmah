import { prisma } from "@/lib/db"
import { catalogInclude } from "@/lib/store/catalog"

export const COLLECTION_TYPES = [
  "PERMANENTE",
  "SAISONNIERE",
  "EVENEMENTIELLE",
  "LIMITEE",
  "MEMBRE",
  "SOLIDAIRE",
] as const

/** Une collection n'est publique que si active ET dans sa fenêtre de dates (si définie). */
function dateWindowFilter(now: Date) {
  return {
    active: true,
    OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
  }
}

export async function getActiveCollections() {
  const now = new Date()
  return prisma.collection.findMany({
    where: dateWindowFilter(now),
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  })
}

export async function getCollectionBySlug(slug: string) {
  const now = new Date()
  const collection = await prisma.collection.findFirst({
    where: { slug, ...dateWindowFilter(now) },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: { product: { include: catalogInclude } },
      },
    },
  })
  if (!collection) return null

  const products = collection.products
    .map((pc) => pc.product)
    .filter((p) => p.active)

  return { collection, products }
}
