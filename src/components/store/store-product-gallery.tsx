"use client"

import { useRef, useState } from "react"
import { Package } from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import { cn } from "@/lib/utils"

export type GalleryImage = { url: string; alt: string }

export function StoreProductGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)]">
        <Package className="size-16 text-[var(--ak-gold)]/70" aria-hidden />
      </div>
    )
  }

  function goTo(index: number) {
    setActive(index)
    const el = scrollRef.current
    if (el) {
      el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" })
    }
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (index !== active) setActive(index)
  }

  return (
    <div className="md:flex md:gap-4">
      {images.length > 1 && (
        <div className="hidden shrink-0 flex-col gap-2 md:flex">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Voir l'image ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "relative size-16 overflow-hidden rounded-xl border-2 transition-colors",
                active === i ? "border-[var(--ak-gold)]" : "border-transparent hover:border-[var(--ak-ink)]/15"
              )}
            >
              <AppImage src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1">
        {/* Desktop : image active statique. Mobile : carousel scrollable. */}
        <div className="relative hidden aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)] md:block">
          <AppImage
            src={images[active].url}
            alt={images[active].alt}
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex aspect-square snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-3xl md:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <div
              key={img.url + i}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)]"
            >
              <AppImage src={img.url} alt={img.alt} fill sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 md:hidden">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all",
                  active === i ? "w-4 bg-[var(--ak-gold)]" : "bg-white/60"
                )}
              />
            ))}
          </div>
        )}
        {images.length > 1 && (
          <span className="absolute top-3 right-3 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white md:hidden">
            {active + 1}/{images.length}
          </span>
        )}
      </div>
    </div>
  )
}
