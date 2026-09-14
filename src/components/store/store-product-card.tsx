import Link from "next/link"
import { Award, Package, PenLine, ShoppingBag, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AppImage } from "@/components/media/app-image"
import { StoreRatingStars } from "@/components/store/store-rating-stars"
import { formatFcfa } from "@/lib/format"
import type { ProductAvailability } from "@/lib/store/catalog"

const CATEGORY_ICONS: Record<string, typeof Package> = {
  identite: Award,
  papeterie: PenLine,
  textile: ShoppingBag,
  packs: Sparkles,
}

export type StoreProductCardData = {
  slug: string
  name: string
  categorySlug?: string | null
  price: number
  maxPrice?: number
  priceIsRange?: boolean
  compareAtPrice?: number | null
  coverImage?: { url: string; alt: string } | null
  availability: ProductAvailability
  limitedEdition?: boolean
  isNew?: boolean
  rating?: { average: number; count: number } | null
}

export function StoreProductCard({ product }: { product: StoreProductCardData }) {
  const Icon = (product.categorySlug && CATEGORY_ICONS[product.categorySlug]) || Package
  const outOfStock = product.availability === "out_of_stock"

  return (
    <Link
      href={`/boutique/produits/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(11,58,37,0.08)] transition-shadow hover:shadow-[0_8px_30px_rgba(11,58,37,0.14)]"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)]">
        {product.coverImage ? (
          <AppImage
            src={product.coverImage.url}
            alt={product.coverImage.alt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Icon className="size-12 text-[var(--ak-gold)]/70" aria-hidden />
        )}

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.isNew && (
            <Badge className="bg-[var(--ak-gold)] text-[var(--ak-emerald-deep)]">
              Nouveau
            </Badge>
          )}
          {product.limitedEdition && (
            <Badge variant="secondary">Édition limitée</Badge>
          )}
          {product.availability === "preorder" && (
            <Badge className="bg-blue-600 text-white">Précommande</Badge>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge variant="outline" className="border-white bg-black/60 text-white">
              Rupture de stock
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-sm font-medium text-[var(--ak-ink)]">
          {product.name}
        </p>
        {product.rating && product.rating.count > 0 && (
          <div className="flex items-center gap-1.5">
            <StoreRatingStars rating={product.rating.average} />
            <span className="text-xs text-[var(--ak-ink-soft)]">({product.rating.count})</span>
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="font-semibold text-[var(--ak-emerald-deep)]">
            {product.priceIsRange ? "Dès " : ""}
            {formatFcfa(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-[var(--ak-ink-soft)] line-through">
              {formatFcfa(product.compareAtPrice)}
            </span>
          )}
        </div>
        {product.availability === "low_stock" && (
          <p className="text-xs font-medium text-amber-700">Stock faible</p>
        )}
      </div>
    </Link>
  )
}
