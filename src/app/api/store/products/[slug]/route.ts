import { NextResponse } from "next/server"
import {
  availabilityStatus,
  availableStock,
  getProductBySlug,
  summarizeProduct,
} from "@/lib/store/catalog"

type Params = { params: Promise<{ slug: string }> }

/** Fiche produit publique — 404 si inactif ou introuvable. */
export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params
  const result = await getProductBySlug(slug)
  if (!result) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }
  const { product, related } = result
  const summary = summarizeProduct(product)

  return NextResponse.json(
    {
      product: {
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category?.name ?? null,
        categorySlug: product.category?.slug ?? null,
        price: summary.minPrice,
        maxPrice: summary.maxPrice,
        priceIsRange: summary.priceIsRange,
        compareAtPrice: product.compareAtPrice,
        images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
        availability: summary.availability,
        limitedEdition: product.limitedEdition,
        limitedTotal: product.limitedTotal,
        preorder: product.preorder,
        isNew: product.isNew,
        variants: product.variants.map((v) => {
          const stock = availableStock(v)
          return {
            id: v.id,
            label: v.label,
            attributes: JSON.parse(v.attributes) as Record<string, string>,
            price: v.priceOverride ?? product.price,
            availability: availabilityStatus(stock, product.lowStockThreshold, product.preorder),
          }
        }),
      },
      related: related.map((p) => {
        const s = summarizeProduct(p)
        return {
          slug: p.slug,
          name: p.name,
          price: s.minPrice,
          priceIsRange: s.priceIsRange,
          coverImage: s.coverImage,
          availability: s.availability,
        }
      }),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  )
}
