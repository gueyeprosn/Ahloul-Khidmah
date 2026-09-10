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

      <section className="relative overflow-hidden bg-[var(--ak-emerald-deep)] px-5 pt-28 pb-16 md:px-8 md:pt-36 md:pb-20">
        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ivory)]/55">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-[var(--ak-gold-light)]">
                  Accueil
                </Link>
              </li>
              <li aria-hidden className="text-[var(--ak-gold)]/60">/</li>
              <li className="text-[var(--ak-ivory)]/80">Boutique</li>
            </ol>
          </nav>

          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-gold)] uppercase">
            Ahloul Khidmah Store
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-amiri)] text-4xl leading-tight text-[var(--ak-ivory)] md:text-5xl">
            Porter nos valeurs. Soutenir nos actions.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ivory)]/75 md:text-lg">
            Pins, porte-clés, papeterie et textile Ahloul Khidmah — des objets qui
            portent l&apos;identité de la communauté, avec un impact réel sur nos
            actions.
          </p>
          <StoreSearch className="mt-6 max-w-sm" />
        </div>
      </section>

      <div className="relative z-10 -mt-6">
        <StoreTrustBar />
      </div>

      <div className="mt-8">
        <StoreCampaignBanner />
      </div>

      <section className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/boutique"
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
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
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                categorie === c.slug
                  ? "border-[var(--ak-emerald-deep)] bg-[var(--ak-emerald-deep)] text-[var(--ak-ivory)]"
                  : "border-[var(--ak-ink)]/15 text-[var(--ak-ink)] hover:border-[var(--ak-emerald-deep)]/40"
              )}
            >
              {c.name} ({c._count.products})
            </Link>
          ))}
          <Link
            href="/boutique/collections"
            className="flex items-center gap-1.5 rounded-full border border-[var(--ak-gold)]/50 px-4 py-2 text-sm font-medium text-[var(--ak-gold-dark)] transition-colors hover:border-[var(--ak-gold)] hover:bg-[var(--ak-ivory)]"
          >
            <Layers className="size-3.5" aria-hidden />
            Collections
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
          <div className="mt-16 flex flex-col items-center gap-3 py-16 text-center">
            <ShoppingBag className="size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
            <p className="text-[var(--ak-ink-soft)]">
              {categorie || hasActiveFilters
                ? "Aucun produit ne correspond à ces critères."
                : "La boutique ouvre bientôt — revenez très vite."}
            </p>
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

      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <StoreImpactCard />
      </section>
    </>
  )
}
