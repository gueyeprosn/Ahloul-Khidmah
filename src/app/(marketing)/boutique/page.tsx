import type { Metadata } from "next"
import Link from "next/link"
import { Layers, ShoppingBag } from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { StoreProductCard } from "@/components/store/store-product-card"
import { StoreImpactCard } from "@/components/store/store-impact-card"
import { StoreFilters } from "@/components/store/store-filters"
import { StoreSearch } from "@/components/store/store-search"
import { StoreTrustBar } from "@/components/store/store-trust-bar"
import { StoreCampaignBanner } from "@/components/store/store-campaign-banner"
import {
  getCatalogCategories,
  getCatalogProducts,
  summarizeProduct,
  type CatalogAvailabilityFilter,
  type CatalogSort,
} from "@/lib/store/catalog"
import { getReviewStatsForProducts } from "@/lib/store/reviews"
import { buildMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const metadata: Metadata = buildMetadata({
  title: "Boutique — Ahloul Khidmah Store",
  description:
    "Porter nos valeurs, soutenir nos actions. Pins, porte-clés, textile et papeterie Ahloul Khidmah — paiement sécurisé, livraison au Sénégal.",
  path: "/boutique",
})

type BoutiqueSearchParams = {
  categorie?: string
  prixMin?: string
  prixMax?: string
  disponibilite?: string
  promo?: string
  edition?: string
  nouveau?: string
  tri?: string
}

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<BoutiqueSearchParams>
}) {
  const sp = await searchParams
  const categorie = sp.categorie
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

  const [categories, { products, total }] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts({
      categorySlug: categorie,
      minPrice: prixMin,
      maxPrice: prixMax,
      availability: disponibilite,
      promo,
      limitedEdition: edition,
      isNew: nouveau,
      sort: tri,
    }),
  ])
  const ratings = await getReviewStatsForProducts(products.map((p) => p.id))

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Boutique", path: "/boutique" },
        ]}
      />

      {/* En-tête compact — les produits doivent apparaître tout de suite */}
      <section className="border-b border-[var(--ak-gold)]/20 bg-[var(--ak-emerald-deep)] px-5 pt-24 pb-5 md:px-8 md:pt-28 md:pb-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <nav aria-label="Fil d'Ariane" className="mb-2 text-xs text-[var(--ak-ivory)]/50">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-[var(--ak-gold-light)]">
                    Accueil
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-[var(--ak-ivory)]/75">Boutique</li>
              </ol>
            </nav>
            <h1 className="font-[family-name:var(--font-amiri)] text-2xl leading-tight text-[var(--ak-ivory)] md:text-3xl">
              Boutique
            </h1>
            <p className="mt-1 text-sm text-[var(--ak-ivory)]/65">
              Pins, textile & papeterie — au service de la khidma
            </p>
          </div>
          <StoreSearch className="w-full md:max-w-xs" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-5 pb-10 md:px-8 md:pt-6">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/boutique"
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              !categorie
                ? "border-[var(--ak-emerald-deep)] bg-[var(--ak-emerald-deep)] text-[var(--ak-ivory)]"
                : "border-[var(--ak-ink)]/15 text-[var(--ak-ink)] hover:border-[var(--ak-emerald-deep)]/40"
            )}
          >
            Tous
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/boutique?categorie=${c.slug}`}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                categorie === c.slug
                  ? "border-[var(--ak-emerald-deep)] bg-[var(--ak-emerald-deep)] text-[var(--ak-ivory)]"
                  : "border-[var(--ak-ink)]/15 text-[var(--ak-ink)] hover:border-[var(--ak-emerald-deep)]/40"
              )}
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/boutique/collections"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--ak-gold)]/50 px-3.5 py-1.5 text-sm font-medium text-[var(--ak-gold-dark)] transition-colors hover:border-[var(--ak-gold)] hover:bg-white"
          >
            <Layers className="size-3.5" aria-hidden />
            Collections
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--ak-ink-soft)]">
            {total} produit{total > 1 ? "s" : ""}
          </p>
          <StoreFilters
            basePath="/boutique"
            values={{
              categorie,
              prixMin: sp.prixMin,
              prixMax: sp.prixMax,
              disponibilite,
              promo,
              edition,
              nouveau,
              tri,
            }}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {total === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-3 py-12 text-center">
            <ShoppingBag className="size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
            <p className="text-[var(--ak-ink-soft)]">
              {categorie || hasActiveFilters
                ? "Aucun produit ne correspond à ces critères."
                : "La boutique ouvre bientôt — revenez très vite."}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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

        <div className="mt-10 space-y-8">
          <StoreTrustBar compact />
          <StoreCampaignBanner />
          <StoreImpactCard />
        </div>
      </section>
    </>
  )
}
