import { NextResponse } from "next/server"
import { getActiveCollections } from "@/lib/store/collections"

export async function GET() {
  const collections = await getActiveCollections()
  return NextResponse.json(
    {
      collections: collections.map((c) => ({
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        type: c.type,
        coverImage: c.coverImage,
        accentColor: c.accentColor,
        productCount: c._count.products,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  )
}
