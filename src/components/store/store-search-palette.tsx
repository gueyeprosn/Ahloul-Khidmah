"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Package } from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import { formatFcfa } from "@/lib/format"

type Hit = {
  slug: string
  name: string
  price: number
  priceIsRange?: boolean
  maxPrice?: number
  category?: string | null
  coverImage?: { url: string; alt: string } | null
}

export function StoreSearchPalette() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)

  const close = useCallback(() => {
    setOpen(false)
    setQ("")
    setHits([])
    setActive(0)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") close()
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("ak-open-store-search", onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("ak-open-store-search", onOpen)
    }
  }, [close])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
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
        setHits((data.products || []).slice(0, 8))
        setActive(0)
      } catch {
        if (!cancelled) setHits([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 220)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [q, open])

  function go(slug: string) {
    close()
    router.push(`/boutique/produits/${slug}`)
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (hits[active]) go(hits[active].slug)
      else if (q.trim()) {
        close()
        router.push(`/boutique/recherche?q=${encodeURIComponent(q.trim())}`)
      }
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Rechercher dans la boutique"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--ak-gold)]/30 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 border-b border-[#E6DCC0] px-3">
          <Search className="size-4 shrink-0 text-[var(--ak-ink-soft)]" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Rechercher un produit…"
            className="min-h-12 flex-1 bg-transparent text-sm outline-none"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-activedescendant={hits[active] ? `${listId}-${hits[active].slug}` : undefined}
          />
          <kbd className="hidden rounded border border-[#E6DCC0] px-1.5 py-0.5 text-[10px] text-[var(--ak-ink-soft)] sm:inline">
            esc
          </kbd>
          <button
            type="button"
            onClick={close}
            className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--ak-ink-soft)] hover:bg-[var(--ak-ivory)]"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div id={listId} role="listbox" className="max-h-80 overflow-y-auto py-2">
          {loading && (
            <p className="px-4 py-3 text-sm text-[var(--ak-ink-soft)]">Recherche…</p>
          )}
          {!loading && q.trim().length >= 2 && hits.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--ak-ink-soft)]">Aucun produit trouvé.</p>
          )}
          {!loading &&
            hits.map((hit, i) => (
              <button
                key={hit.slug}
                id={`${listId}-${hit.slug}`}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(hit.slug)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                  i === active ? "bg-[var(--ak-ivory)]" : "hover:bg-[var(--ak-ivory)]/70"
                }`}
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
                  <span className="block truncate font-medium text-[var(--ak-ink)]">{hit.name}</span>
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
          {q.trim().length < 2 && (
            <p className="px-4 py-3 text-sm text-[var(--ak-ink-soft)]">
              Tapez au moins 2 caractères
            </p>
          )}
        </div>

        {q.trim().length >= 2 && (
          <button
            type="button"
            onClick={() => {
              close()
              router.push(`/boutique/recherche?q=${encodeURIComponent(q.trim())}`)
            }}
            className="flex w-full border-t border-[#E6DCC0] px-4 py-3 text-left text-sm font-medium text-[var(--ak-emerald-deep)] hover:bg-[var(--ak-ivory)]"
          >
            Voir tous les résultats pour « {q.trim()} »
          </button>
        )}
      </div>
    </div>
  )
}
