import { NextResponse } from "next/server"
import { getCatalogCategories } from "@/lib/store/catalog"

/** Liste publique des catégories actives, avec nombre de produits actifs. */
export async function GET() {
  const categories = await getCatalogCategories()

  return NextResponse.json(
    {
      categories: categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageUrl: c.imageUrl,
        productCount: c._count.products,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  )
}
