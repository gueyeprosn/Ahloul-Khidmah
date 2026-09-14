import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Layers } from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { AppImage } from "@/components/media/app-image"
import { StoreProductCard } from "@/components/store/store-product-card"
import { StoreImpactCard } from "@/components/store/store-impact-card"
import { getCollectionBySlug } from "@/lib/store/collections"
import { summarizeProduct } from "@/lib/store/catalog"
import { getReviewStatsForProducts } from "@/lib/store/reviews"
import { buildMetadata } from "@/lib/seo"

type Params = { params: Promise<{ slug: string }> }

const TYPE_LABEL: Record<string, string> = {
  PERMANENTE: "Permanente",
  SAISONNIERE: "Saisonnière",
  EVENEMENTIELLE: "Événementielle",
  LIMITEE: "Édition limitée",
  MEMBRE: "Réservée aux membres",
  SOLIDAIRE: "Solidaire",
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const result = await getCollectionBySlug(slug)
  if (!result) return buildMetadata({ title: "Collection", path: `/boutique/collections/${slug}` })
  const { collection } = result
  return buildMetadata({
    title: `${collection.name} — Barkelu`,
    description: (collection.tagline || collection.description).slice(0, 160),
    path: `/boutique/collections/${collection.slug}`,
    image: collection.bannerImage
      ? { url: collection.bannerImage, alt: collection.name }
      : collection.coverImage
        ? { url: collection.coverImage, alt: collection.name }
        : undefined,
  })
}

export default async function CollectionDetailPage({ params }: Params) {
  const { slug } = await params
  const result = await getCollectionBySlug(slug)
  if (!result) notFound()
  const { collection, products } = result
  const ratings = await getReviewStatsForProducts(products.map((p) => p.id))

  const heroImage = collection.bannerImage || collection.coverImage
  const accentStyle = collection.accentColor
    ? { backgroundColor: collection.accentColor }
    : undefined

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Barkelu", path: "/boutique" },
          { name: "Collections", path: "/boutique/collections" },
          { name: collection.name, path: `/boutique/collections/${collection.slug}` },
        ]}
      />

      <section
        className="relative overflow-hidden bg-[var(--ak-emerald-deep)] px-5 pt-28 pb-16 md:px-8 md:pt-36 md:pb-20"
        style={accentStyle}
      >
        {heroImage && (
          <div className="absolute inset-0">
            <AppImage src={heroImage} alt={collection.name} fill sizes="100vw" className="object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ak-emerald-deep)] via-[var(--ak-emerald-deep)]/70 to-[var(--ak-emerald-deep)]/40" />
          </div>
        )}
        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ivory)]/55">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-[var(--ak-gold-light)]">
                  Accueil
                </Link>
              </li>
              <li aria-hidden className="text-[var(--ak-gold)]/60">/</li>
              <li>
                <Link href="/boutique/collections" className="hover:text-[var(--ak-gold-light)]">
                  Collections
                </Link>
              </li>
              <li aria-hidden className="text-[var(--ak-gold)]/60">/</li>
              <li className="text-[var(--ak-ivory)]/80">{collection.name}</li>
            </ol>
          </nav>

          <span className="text-xs font-semibold tracking-[0.2em] text-[var(--ak-gold-light)] uppercase">
            {TYPE_LABEL[collection.type] || collection.type}
          </span>
          <h1 className="mt-2 font-[family-name:var(--font-amiri)] text-3xl text-[var(--ak-ivory)] md:text-4xl">
            {collection.name}
          </h1>
          {collection.tagline && (
            <p className="mt-3 max-w-2xl text-lg text-[var(--ak-ivory)]/85">{collection.tagline}</p>
          )}
          <p className="mt-4 max-w-2xl leading-relaxed text-[var(--ak-ivory)]/75">
            {collection.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        {products.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 py-16 text-center">
            <Layers className="size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
            <p className="text-[var(--ak-ink-soft)]">Aucun produit dans cette collection pour le moment.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
