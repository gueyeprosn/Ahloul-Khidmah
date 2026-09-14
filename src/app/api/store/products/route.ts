import { NextResponse } from "next/server"
import { catalogQuerySchema, PAGE_SIZE } from "@/features/store/schema"
import { getCatalogProducts, summarizeProduct } from "@/lib/store/catalog"

/** Catalogue public — filtrable par catégorie et recherche texte. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = catalogQuerySchema.safeParse({
    categorie: searchParams.get("categorie") || undefined,
    q: searchParams.get("q") || undefined,
    suggest: searchParams.get("suggest") || undefined,
    page: searchParams.get("page") || undefined,
    prixMin: searchParams.get("prixMin") || undefined,
    prixMax: searchParams.get("prixMax") || undefined,
    disponibilite: searchParams.get("disponibilite") || undefined,
    promo: searchParams.get("promo") || undefined,
    edition: searchParams.get("edition") || undefined,
    nouveau: searchParams.get("nouveau") || undefined,
    tri: searchParams.get("tri") || undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }
  const {
    categorie,
    q,
    suggest,
    page,
    prixMin,
    prixMax,
    disponibilite,
    promo,
    edition,
    nouveau,
    tri,
  } = parsed.data
  const isSuggest = suggest === "1" || suggest === "true"

  const { products, total } = await getCatalogProducts({
    categorySlug: categorie,
    search: q,
    searchMode: isSuggest ? "suggest" : "full",
    minPrice: prixMin,
    maxPrice: prixMax,
    availability: disponibilite,
    promo,
    limitedEdition: edition,
    isNew: nouveau,
    sort: tri,
    take: isSuggest ? 8 : PAGE_SIZE,
    skip: isSuggest ? 0 : (page - 1) * PAGE_SIZE,
  })

  return NextResponse.json(
    {
      products: products.map((p) => {
        const summary = summarizeProduct(p)
        return {
          slug: p.slug,
          name: p.name,
          category: p.category?.name ?? null,
          categorySlug: p.category?.slug ?? null,
          price: summary.minPrice,
          maxPrice: summary.maxPrice,
          priceIsRange: summary.priceIsRange,
          compareAtPrice: p.compareAtPrice,
          coverImage: summary.coverImage,
          availability: summary.availability,
          limitedEdition: p.limitedEdition,
          limitedTotal: p.limitedTotal,
          preorder: p.preorder,
          isNew: p.isNew,
          featured: p.featured,
        }
      }),
      total,
      page,
      pageSize: PAGE_SIZE,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  )
}
