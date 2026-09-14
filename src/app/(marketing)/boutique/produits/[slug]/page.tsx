import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { BreadcrumbJsonLd, ProductJsonLd } from "@/components/seo/json-ld"
import { AddToCartForm } from "@/components/store/add-to-cart-form"
import { StoreProductCard } from "@/components/store/store-product-card"
import { StoreProductGallery } from "@/components/store/store-product-gallery"
import { StoreImpactCard } from "@/components/store/store-impact-card"
import { StoreRatingStars } from "@/components/store/store-rating-stars"
import { Badge } from "@/components/ui/badge"
import { contact } from "@/content/landing"
import { formatDate, formatFcfa } from "@/lib/format"
import {
  availabilityStatus,
  availableStock,
  getProductBySlug,
  summarizeProduct,
} from "@/lib/store/catalog"
import { displayReviewerName, getApprovedReviews, getReviewStats } from "@/lib/store/reviews"
import { buildMetadata } from "@/lib/seo"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const result = await getProductBySlug(slug)
  if (!result) return buildMetadata({ title: "Produit", path: `/boutique/produits/${slug}` })
  const { product } = result
  return buildMetadata({
    title: `${product.name} — Barkelu`,
    description: product.description.slice(0, 160),
    path: `/boutique/produits/${product.slug}`,
    image: product.images[0]
      ? { url: product.images[0].url, alt: product.images[0].alt }
      : undefined,
  })
}

const AVAILABILITY_LABEL: Record<string, { label: string; className: string }> = {
  in_stock: { label: "En stock", className: "bg-emerald-100 text-emerald-800" },
  low_stock: { label: "Stock faible", className: "bg-amber-100 text-amber-800" },
  out_of_stock: { label: "Rupture de stock", className: "bg-red-100 text-red-800" },
  preorder: { label: "Précommande", className: "bg-blue-100 text-blue-800" },
}

export default async function ProduitPage({ params }: Params) {
  const { slug } = await params
  const result = await getProductBySlug(slug)
  if (!result) notFound()
  const { product, related } = result
  const summary = summarizeProduct(product)
  const availability = AVAILABILITY_LABEL[summary.availability]
  const [reviews, reviewStats] = await Promise.all([
    getApprovedReviews(product.id),
    getReviewStats(product.id),
  ])

  const waMessage = encodeURIComponent(
    `Assalamu aleykum, je souhaite commander : ${product.name} (réf. ${product.sku}).`
  )

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Barkelu", path: "/boutique" },
          { name: product.name, path: `/boutique/produits/${product.slug}` },
        ]}
      />
      <ProductJsonLd
        name={product.name}
        description={product.description}
        slug={product.slug}
        sku={product.sku}
        price={summary.minPrice}
        priceIsRange={summary.priceIsRange}
        images={product.images.map((img) => img.url)}
        availability={summary.availability}
      />

      <section className="mx-auto max-w-6xl px-5 pt-28 pb-16 md:px-8 md:pt-36">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ink-soft)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:underline">Accueil</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/boutique" className="hover:underline">Barkelu</Link></li>
            <li aria-hidden>/</li>
            <li className="text-[var(--ak-ink)]">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="relative">
            <StoreProductGallery images={product.images.map((img) => ({ url: img.url, alt: img.alt }))} />
            {product.limitedEdition && (
              <Badge className="absolute top-4 left-4 z-10" variant="secondary">
                Édition limitée
              </Badge>
            )}
          </div>

          <div>
            {product.category && (
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--ak-gold-dark)] uppercase">
                {product.category.name}
              </p>
            )}
            <h1 className="mt-2 font-[family-name:var(--font-amiri)] text-3xl text-[var(--ak-ink)] md:text-4xl">
              {product.name}
            </h1>

            {reviewStats.count > 0 && (
              <a href="#avis" className="mt-2 flex items-center gap-2 text-sm text-[var(--ak-ink-soft)]">
                <StoreRatingStars rating={reviewStats.average} />
                <span>
                  {reviewStats.average} ({reviewStats.count} avis)
                </span>
              </a>
            )}

            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-semibold text-[var(--ak-emerald-deep)]">
                {summary.priceIsRange ? "Dès " : ""}
                {formatFcfa(summary.minPrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > summary.minPrice && (
                <span className="text-base text-[var(--ak-ink-soft)] line-through">
                  {formatFcfa(product.compareAtPrice)}
                </span>
              )}
            </div>

            <span
              className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${availability.className}`}
            >
              {availability.label}
            </span>

            <p className="mt-6 leading-relaxed text-[var(--ak-ink-soft)]">
              {product.description}
            </p>

            <AddToCartForm
              productId={product.id}
              slug={product.slug}
              sku={product.sku}
              name={product.name}
              basePrice={product.price}
              image={product.images[0] ? { url: product.images[0].url, alt: product.images[0].alt } : null}
              availability={summary.availability}
              variants={product.variants.map((v) => ({
                id: v.id,
                label: v.label,
                price: v.priceOverride ?? product.price,
                availability: availabilityStatus(availableStock(v), product.lowStockThreshold, product.preorder),
              }))}
            />

            <div className="mt-6">
              <StoreImpactCard variant="compact" />
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--ak-gold)]/30 bg-[var(--ak-ivory)] p-5">
              <p className="text-sm text-[var(--ak-ink-soft)]">
                Vous préférez commander directement ? Contactez-nous par WhatsApp.
              </p>
              <a
                href={`${contact.whatsappHref}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-[var(--ak-ivory)] transition-colors hover:bg-[var(--ak-emerald-mid)]"
              >
                <MessageCircle className="size-4" aria-hidden />
                Commander via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {reviews.length > 0 && (
          <div id="avis" className="mt-16 scroll-mt-24">
            <h2 className="text-xl font-semibold text-[var(--ak-ink)]">
              Avis clients
              <span className="ml-2 text-sm font-normal text-[var(--ak-ink-soft)]">
                {reviewStats.average} sur 5 — {reviewStats.count} avis
              </span>
            </h2>
            <div className="mt-6 space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[#E6DCC0] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StoreRatingStars rating={r.rating} />
                      <span className="text-sm font-medium text-[var(--ak-ink)]">
                        {displayReviewerName(r.customerName)}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--ak-ink-soft)]">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-[var(--ak-ink)]">
              Vous aimerez aussi
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => {
                const s = summarizeProduct(p)
                return (
                  <StoreProductCard
                    key={p.slug}
                    product={{
                      slug: p.slug,
                      name: p.name,
                      categorySlug: p.category?.slug,
                      price: s.minPrice,
                      maxPrice: s.maxPrice,
                      priceIsRange: s.priceIsRange,
                      compareAtPrice: p.compareAtPrice,
                      coverImage: s.coverImage,
                      availability: s.availability,
                      limitedEdition: p.limitedEdition,
                      isNew: p.isNew,
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
