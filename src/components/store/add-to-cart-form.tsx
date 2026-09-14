"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { formatFcfa } from "@/lib/format"
import { useCart } from "@/components/store/cart-provider"

export type AddToCartVariant = {
  id: string
  label: string
  price: number
  availability: "in_stock" | "low_stock" | "out_of_stock" | "preorder"
}

export function AddToCartForm({
  productId,
  slug,
  sku,
  name,
  basePrice,
  image,
  availability,
  variants,
}: {
  productId: string
  slug: string
  sku: string
  name: string
  basePrice: number
  image: { url: string; alt: string } | null
  availability: "in_stock" | "low_stock" | "out_of_stock" | "preorder"
  variants: AddToCartVariant[]
}) {
  const { addItem, openDrawer } = useCart()
  const router = useRouter()
  const [variantId, setVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === variantId) ?? null,
    [variants, variantId]
  )

  const needsVariantChoice = variants.length > 0
  const effectiveAvailability = selectedVariant?.availability ?? availability
  const outOfStock = effectiveAvailability === "out_of_stock"
  const isPreorder = effectiveAvailability === "preorder"
  const canAdd = !outOfStock && (!needsVariantChoice || Boolean(selectedVariant))

  function handleAdd() {
    if (!canAdd) return
    addItem(
      {
        productId,
        variantId: selectedVariant?.id ?? null,
        slug,
        name,
        variantLabel: selectedVariant?.label ?? null,
        sku,
        unitPrice: selectedVariant?.price ?? basePrice,
        image,
      },
      quantity
    )
    setAdded(true)
    router.refresh()
    openDrawer()
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mt-6 space-y-4">
      {needsVariantChoice && (
        <div>
          <p className="text-sm font-semibold text-[var(--ak-ink)]">Options</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.availability === "out_of_stock"}
                onClick={() => setVariantId(v.id)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  variantId === v.id
                    ? "border-[var(--ak-emerald-deep)] bg-[var(--ak-emerald-deep)] text-[var(--ak-ivory)]"
                    : "border-[var(--ak-ink)]/15 text-[var(--ak-ink)] hover:border-[var(--ak-emerald-deep)]/40"
                }`}
              >
                {v.label} · {formatFcfa(v.price)}
                {v.availability === "out_of_stock" && " (rupture)"}
                {v.availability === "preorder" && " (précommande)"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-[var(--ak-ink)]/15">
          <button
            type="button"
            aria-label="Diminuer la quantité"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-9 items-center justify-center text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            aria-label="Augmenter la quantité"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="flex size-9 items-center justify-center text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          disabled={!canAdd}
          onClick={handleAdd}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-[var(--ak-ivory)] transition-colors hover:bg-[var(--ak-emerald-mid)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="size-4" aria-hidden />
          {added
            ? "Ajouté au panier"
            : outOfStock
              ? "Rupture de stock"
              : isPreorder
                ? "Précommander"
                : "Ajouter au panier"}
        </button>
      </div>

      {isPreorder && (
        <p className="text-xs text-[var(--ak-ink-soft)]">
          Ce produit est en précommande — expédition dès réapprovisionnement.
        </p>
      )}
    </div>
  )
}
