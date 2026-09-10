import type { Metadata } from "next"
import Link from "next/link"
import { Search } from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { StoreProductCard } from "@/components/store/store-product-card"
import { StoreSearch } from "@/components/store/store-search"
import { StoreFilters } from "@/components/store/store-filters"
import {
  getCatalogProducts,
  summarizeProduct,
  type CatalogAvailabilityFilter,
  type CatalogSort,
} from "@/lib/store/catalog"
import { getReviewStatsForProducts } from "@/lib/store/reviews"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Recherche — Ahloul Khidmah Store",
  path: "/boutique/recherche",
  noIndex: true,
})

type SearchParams = {
  q?: string
  prixMin?: string
  prixMax?: string
  disponibilite?: string
  promo?: string
  edition?: string
  nouveau?: string
  tri?: string
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() || ""
  const prixMin = sp.prixMin ? Number(sp.prixMin) : undefined
  const prixMax = sp.prixMax ? Number(sp.prixMax) : undefined
  const disponibilite = (sp.disponibilite as CatalogAvailabilityFilter) || "all"
  const promo = sp.promo === "true"
  const edition = sp.edition === "true"
  const nouveau = sp.nouveau === "true"
  const tri = (sp.tri as CatalogSort) || "pertinence"

  const hasActiveFilters = Boolean(
    prixMin || prixMax || disponibilite !== "all" || promo || edition || nouveau || tri !== "pertinence"
  )

  const { products, total } = q
    ? await getCatalogProducts({
        search: q,
        minPrice: prixMin,
        maxPrice: prixMax,
        availability: disponibilite,
        promo,
        limitedEdition: edition,
        isNew: nouveau,
        sort: tri,
      })
    : { products: [], total: 0 }
  const ratings =
    q && products.length > 0
      ? await getReviewStatsForProducts(products.map((p) => p.id))
      : new Map<string, { average: number; count: number }>()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Boutique", path: "/boutique" },
          { name: "Recherche", path: "/boutique/recherche" },
        ]}
      />

      <section className="mx-auto max-w-6xl px-5 pt-28 pb-16 md:px-8 md:pt-36">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ink-soft)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:underline">Accueil</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/boutique" className="hover:underline">Boutique</Link></li>
            <li aria-hidden>/</li>
            <li className="text-[var(--ak-ink)]">Recherche</li>
          </ol>
        </nav>

        <h1 className="font-[family-name:var(--font-amiri)] text-3xl text-[var(--ak-ink)] md:text-4xl">
          {q ? `Recherche pour « ${q} »` : "Rechercher un produit"}
        </h1>
        {q && (
          <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">
            {total} résultat{total > 1 ? "s" : ""}
          </p>
        )}

        <StoreSearch defaultValue={q} className="mt-6 max-w-sm" />

        {q && (
          <div className="mt-6">
            <StoreFilters
              basePath="/boutique/recherche"
              values={{ q, prixMin: sp.prixMin, prixMax: sp.prixMax, disponibilite, promo, edition, nouveau, tri }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        )}

        {!q ? (
          <div className="mt-16 flex flex-col items-center gap-3 py-16 text-center">
            <Search className="size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
            <p className="text-[var(--ak-ink-soft)]">Entrez un mot-clé pour rechercher un produit.</p>
          </div>
        ) : total === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 py-16 text-center">
            <Search className="size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
            <p className="text-[var(--ak-ink-soft)]">Aucun produit trouvé pour « {q} ».</p>
            <Link href="/boutique" className="ak-cta-solid mt-2 rounded-2xl px-5 py-3 text-sm font-semibold">
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const summary = summarizeProduct(p)
              return (
                <StoreProductCard
                  key={p.slug}
                  product={{
                    slug: p.slug,
                    name: p.name,
                    categorySlug: p.category?.slug,
                    price: summary.minPrice,
                    maxPrice: summary.maxPrice,
                    priceIsRange: summary.priceIsRange,
                    compareAtPrice: p.compareAtPrice,
                    coverImage: summary.coverImage,
                    availability: summary.availability,
                    limitedEdition: p.limitedEdition,
                    isNew: p.isNew,
                    rating: ratings.get(p.id) ?? null,
                  }}
                />
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
