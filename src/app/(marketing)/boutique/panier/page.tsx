"use client"

import Link from "next/link"
import { Minus, Package, Plus, ShoppingBag, Trash2, X } from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import { contact } from "@/content/landing"
import { formatFcfa } from "@/lib/format"
import { useCart } from "@/components/store/cart-provider"

export default function PanierPage() {
  const { items, subtotal, removeItem, setQuantity, clear } = useCart()

  const waMessage = encodeURIComponent(
    [
      "Assalamu aleykum, je souhaite commander :",
      ...items.map(
        (i) =>
          `- ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""} x${i.quantity} — réf. ${i.sku}`
      ),
      `Total estimé : ${formatFcfa(subtotal)}`,
    ].join("\n")
  )

  return (
    <section className="mx-auto max-w-4xl px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ink-soft)]">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:underline">Accueil</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/boutique" className="hover:underline">Barkelu</Link></li>
          <li aria-hidden>/</li>
          <li className="text-[var(--ak-ink)]">Panier</li>
        </ol>
      </nav>

      <h1 className="font-[family-name:var(--font-amiri)] text-3xl text-[var(--ak-ink)] md:text-4xl">
        Votre panier
      </h1>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 py-16 text-center">
          <ShoppingBag className="size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
          <p className="text-[var(--ak-ink-soft)]">Votre panier est vide.</p>
          <Link
            href="/boutique"
            className="ak-cta-solid rounded-2xl px-5 py-3 text-sm font-semibold"
          >
            Découvrir Barkelu
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.variantId ?? "base"}`}
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(11,58,37,0.08)]"
              >
                <Link
                  href={`/boutique/produits/${item.slug}`}
                  className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)]"
                >
                  {item.image ? (
                    <AppImage
                      src={item.image.url}
                      alt={item.image.alt}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <Package className="size-7 text-[var(--ak-gold)]/70" aria-hidden />
                  )}
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/boutique/produits/${item.slug}`}
                        className="text-sm font-medium text-[var(--ak-ink)] hover:underline"
                      >
                        {item.name}
                      </Link>
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
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-xl border border-[var(--ak-ink)]/15">
                      <button
                        type="button"
                        aria-label="Diminuer la quantité"
                        onClick={() =>
                          setQuantity(item.productId, item.variantId, item.quantity - 1)
                        }
                        className="flex size-8 items-center justify-center text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
                      >
                        <Minus className="size-3.5" aria-hidden />
                      </button>
                      <span className="w-7 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Augmenter la quantité"
                        onClick={() =>
                          setQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                        className="flex size-8 items-center justify-center text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <span className="font-semibold text-[var(--ak-emerald-deep)]">
                      {formatFcfa(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}

            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--ak-ink-soft)] hover:text-red-600"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Vider le panier
            </button>
          </ul>

          <div className="h-fit rounded-2xl border border-[var(--ak-gold)]/30 bg-[var(--ak-ivory)] p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--ak-ink-soft)]">Sous-total</span>
              <span className="font-semibold text-[var(--ak-ink)]">
                {formatFcfa(subtotal)}
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--ak-ink-soft)]">
              Livraison calculée à l&apos;étape suivante.
            </p>

            <Link
              href="/boutique/checkout"
              className="ak-cta-solid mt-4 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
            >
              Passer la commande
            </Link>

            <p className="mt-4 text-xs text-[var(--ak-ink-soft)]">
              Vous préférez commander directement ?{" "}
              <a
                href={`${contact.whatsappHref}?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--ak-emerald-deep)] underline-offset-2 hover:underline"
              >
                Contactez-nous par WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
