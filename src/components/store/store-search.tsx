"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Search } from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import { formatFcfa } from "@/lib/format"
import { cn } from "@/lib/utils"

type Hit = {
  slug: string
  name: string
  price: number
  priceIsRange?: boolean
  maxPrice?: number
  category?: string | null
  coverImage?: { url: string; alt: string } | null
}

export function StoreSearch({
  defaultValue = "",
  className,
}: {
  defaultValue?: string
  className?: string
}) {
  const router = useRouter()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [q, setQ] = useState(defaultValue)
  const [hits, setHits] = useState<Hit[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    setQ(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/store/products?q=${encodeURIComponent(query)}&suggest=1`,
          { credentials: "same-origin" }
        )
        const data = await res.json()
        if (cancelled) return
        setHits((data.products || []).slice(0, 6))
        setActive(0)
        setOpen(true)
      } catch {
        if (!cancelled) setHits([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [q])

  function go(slug: string) {
    setOpen(false)
    router.push(`/boutique/produits/${slug}`)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    if (hits[active]) {
      go(hits[active].slug)
      return
    }
    setOpen(false)
    router.push(`/boutique/recherche?q=${encodeURIComponent(query)}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, hits.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const showPanel = open && q.trim().length >= 2

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="store-search" className="sr-only">
          Rechercher un produit
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ak-ink-soft)]"
            aria-hidden
          />
          <input
            id="store-search"
            type="search"
            name="q"
            value={q}
            autoComplete="off"
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              if (q.trim().length >= 2) setOpen(true)
            }}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un produit…"
            className="h-10 w-full rounded-full border border-[var(--ak-ink)]/15 bg-white pr-4 pl-10 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showPanel}
          />
        </div>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 overflow-hidden rounded-2xl border border-[var(--ak-gold)]/30 bg-white shadow-[0_12px_40px_rgba(11,58,37,0.18)]"
        >
          {loading && (
            <p className="px-4 py-3 text-sm text-[var(--ak-ink-soft)]">Recherche…</p>
          )}
          {!loading && hits.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--ak-ink-soft)]">Aucun produit trouvé.</p>
          )}
          {!loading &&
            hits.map((hit, i) => (
              <button
                key={hit.slug}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(hit.slug)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                  i === active ? "bg-[var(--ak-ivory)]" : "hover:bg-[var(--ak-ivory)]/70"
                )}
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)]">
                  {hit.coverImage?.url ? (
                    <AppImage
                      src={hit.coverImage.url}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <Package className="size-5 text-[var(--ak-gold)]/70" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-[var(--ak-ink)]">
                    {hit.name}
                  </span>
                  {hit.category && (
                    <span className="mt-0.5 block truncate text-xs text-[var(--ak-ink-soft)]">
                      {hit.category}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-medium text-[var(--ak-emerald-deep)]">
                  {hit.priceIsRange && hit.maxPrice
                    ? `${formatFcfa(hit.price)} – ${formatFcfa(hit.maxPrice)}`
                    : formatFcfa(hit.price)}
                </span>
              </button>
            ))}
          {!loading && hits.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                router.push(`/boutique/recherche?q=${encodeURIComponent(q.trim())}`)
              }}
              className="flex w-full border-t border-[#E6DCC0] px-4 py-2.5 text-left text-sm font-medium text-[var(--ak-emerald-deep)] hover:bg-[var(--ak-ivory)]"
            >
              Voir tous les résultats
            </button>
          )}
        </div>
      )}
    </div>
  )
}
