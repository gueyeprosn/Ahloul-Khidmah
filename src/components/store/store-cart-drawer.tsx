"use client"

import Link from "next/link"
import { Minus, Package, Plus, ShoppingBag, X } from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { formatFcfa } from "@/lib/format"
import { useCart } from "@/components/store/cart-provider"

export function StoreCartDrawer() {
  const { items, subtotal, itemCount, drawerOpen, closeDrawer, removeItem, setQuantity } = useCart()

  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => (open ? null : closeDrawer())}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-[#E6DCC0]">
          <SheetTitle className="font-[family-name:var(--font-amiri)] text-lg text-[var(--ak-emerald-deep)]">
            Votre panier {itemCount > 0 ? `(${itemCount})` : ""}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="size-8 text-[var(--ak-ink-soft)]/40" aria-hidden />
            <p className="text-sm text-[var(--ak-ink-soft)]">Votre panier est encore vide.</p>
            <Link
              href="/boutique"
              onClick={closeDrawer}
              className="ak-cta-solid rounded-2xl px-4 py-2.5 text-sm font-semibold"
            >
              Découvrir Barkelu
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto px-4">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId ?? "base"}`}
                  className="flex gap-3 rounded-xl border border-[#E6DCC0] p-3"
                >
                  <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)]">
                    {item.image ? (
                      <AppImage src={item.image.url} alt={item.image.alt} fill sizes="56px" className="object-cover" />
                    ) : (
                      <Package className="size-5 text-[var(--ak-gold)]/70" aria-hidden />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--ak-ink)]">{item.name}</p>
                        {item.variantLabel && (
                          <p className="text-xs text-[var(--ak-ink-soft)]">{item.variantLabel}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label="Retirer du panier"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-[var(--ak-ink-soft)] hover:text-red-600"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <div className="flex items-center rounded-lg border border-[var(--ak-ink)]/15">
                        <button
                          type="button"
                          aria-label="Diminuer la quantité"
                          onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="flex size-6 items-center justify-center text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
                        >
                          <Minus className="size-3" aria-hidden />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Augmenter la quantité"
                          onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="flex size-6 items-center justify-center text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
                        >
                          <Plus className="size-3" aria-hidden />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-[var(--ak-emerald-deep)]">
                        {formatFcfa(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="border-t border-[#E6DCC0]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--ak-ink-soft)]">Sous-total</span>
                <span className="text-base font-semibold text-[var(--ak-emerald-deep)]">
                  {formatFcfa(subtotal)}
                </span>
              </div>
              <Link
                href="/boutique/checkout"
                onClick={closeDrawer}
                className="ak-cta-solid flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Passer la commande
              </Link>
              <Link
                href="/boutique/panier"
                onClick={closeDrawer}
                className="flex items-center justify-center rounded-2xl border border-[var(--ak-ink)]/15 px-4 py-2.5 text-sm font-medium text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
              >
                Voir le panier
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
