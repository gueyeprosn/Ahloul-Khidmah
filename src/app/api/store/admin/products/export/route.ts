import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { toCsv, csvResponse } from "@/lib/csv"
import { availableStock } from "@/lib/store/catalog"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } }, variants: true },
    orderBy: { createdAt: "desc" },
  })

  const header = [
    "nom",
    "sku",
    "slug",
    "categorie",
    "prix",
    "prix_barre",
    "stock",
    "reserve",
    "disponible",
    "seuil_stock_faible",
    "actif",
    "mis_en_avant",
    "nouveaute",
    "edition_limitee",
    "nb_variantes",
    "cree_le",
  ]

  const rows = products.map((p) => {
    const stock = p.variants.length > 0
      ? p.variants.reduce((s, v) => s + v.stock, 0)
      : p.stock
    const reserved = p.variants.length > 0
      ? p.variants.reduce((s, v) => s + v.reserved, 0)
      : p.reserved
    const available = p.variants.length > 0
      ? p.variants.reduce((s, v) => s + availableStock(v), 0)
      : availableStock(p)
    return [
      p.name,
      p.sku,
      p.slug,
      p.category?.name || "",
      p.price,
      p.compareAtPrice ?? "",
      stock,
      reserved,
      available,
      p.lowStockThreshold,
      p.active ? "oui" : "non",
      p.featured ? "oui" : "non",
      p.isNew ? "oui" : "non",
      p.limitedEdition ? "oui" : "non",
      p.variants.length,
      p.createdAt.toISOString(),
    ]
  })

  const filename = `produits-${new Date().toISOString().slice(0, 10)}.csv`
  return csvResponse(filename, toCsv(header, rows))
}
