"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { InlineMessage } from "@/components/shared/inline-message"
import { formatFcfa } from "@/lib/format"

export type CollectionProductRow = {
  id: string
  name: string
  slug: string
  price: number
}

type AdminProductOption = {
  id: string
  name: string
  slug: string
  price: number
}

export function CollectionProductsManager({
  collectionId,
  products,
}: {
  collectionId: string
  products: CollectionProductRow[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<AdminProductOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/store/admin/products")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setOptions(data.products || [])
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const currentIds = useMemo(() => new Set(products.map((p) => p.id)), [products])

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return options
      .filter((p) => !currentIds.has(p.id))
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [options, query, currentIds])

  async function addProduct(productId: string) {
    setPendingId(productId)
    setError(null)
    try {
      const res = await fetch(`/api/store/admin/collections/${collectionId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      setQuery("")
      router.refresh()
    } catch {
      setError("Erreur réseau")
    } finally {
      setPendingId(null)
    }
  }

  async function removeProduct(productId: string) {
    if (!confirm("Retirer ce produit de la collection ?")) return
    setPendingId(productId)
    try {
      await fetch(
        `/api/store/admin/collections/${collectionId}/products?productId=${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      )
      router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loadingOptions ? "Chargement des produits…" : "Rechercher un produit à ajouter…"}
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#E6DCC0] bg-white shadow-lg">
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={pendingId === p.id}
                onClick={() => addProduct(p.id)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--ak-ivory)] disabled:opacity-50"
              >
                <span>{p.name}</span>
                <span className="text-xs text-[var(--ak-ink-soft)]">{formatFcfa(p.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <InlineMessage message={error} />}

      {products.length === 0 ? (
        <p className="text-sm text-[var(--ak-ink-soft)]">Aucun produit dans cette collection.</p>
      ) : (
        <ul className="divide-y divide-[#EEE6D2] rounded-xl border border-[#EEE6D2]">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <Link
                href={`/admin/boutique/produits/${p.id}`}
                className="font-medium text-[var(--ak-emerald-deep)] hover:underline"
              >
                {p.name}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-[var(--ak-ink-soft)]">{formatFcfa(p.price)}</span>
                <button
                  type="button"
                  disabled={pendingId === p.id}
                  onClick={() => removeProduct(p.id)}
                  className="flex size-7 items-center justify-center rounded-full text-[var(--ak-ink-soft)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label="Retirer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
