"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"

export type VariantData = {
  id: string
  label: string
  sku: string
  priceOverride: number | null
  stock: number
  active: boolean
}

export function ProductVariantsManager({
  productId,
  variants,
}: {
  productId: string
  variants: VariantData[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [rows, setRows] = useState(variants)
  const [newLabel, setNewLabel] = useState("")
  const [newSku, setNewSku] = useState("")
  const [newStock, setNewStock] = useState(0)
  const [newPrice, setNewPrice] = useState<string>("")
  const [creating, setCreating] = useState(false)

  function updateRow(id: string, patch: Partial<VariantData>) {
    setRows((r) => r.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }

  async function saveRow(row: VariantData) {
    setSavingId(row.id)
    setError(null)
    try {
      const res = await fetch(`/api/store/admin/products/${productId}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: row.id,
          stock: row.stock,
          priceOverride: row.priceOverride,
          active: row.active,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      router.refresh()
    } catch {
      setError("Erreur réseau")
    } finally {
      setSavingId(null)
    }
  }

  async function createVariant(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/store/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel,
          sku: newSku,
          stock: newStock,
          priceOverride: newPrice ? Number(newPrice) : null,
          attributes: {},
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      setNewLabel("")
      setNewSku("")
      setNewStock(0)
      setNewPrice("")
      router.refresh()
    } catch {
      setError("Erreur réseau")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((v) => (
            <div key={v.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E6DCC0] p-3">
              <div className="min-w-24">
                <p className="text-sm font-medium text-[var(--ak-ink)]">{v.label}</p>
                <p className="text-xs text-[var(--ak-ink-soft)]">{v.sku}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-24"
                  value={v.stock}
                  onChange={(e) => updateRow(v.id, { stock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prix (vide = prix produit)</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-32"
                  value={v.priceOverride ?? ""}
                  onChange={(e) =>
                    updateRow(v.id, { priceOverride: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={v.active}
                  onChange={(e) => updateRow(v.id, { active: e.target.checked })}
                />
                Actif
              </label>
              <Button
                type="button"
                size="sm"
                disabled={savingId === v.id}
                onClick={() => saveRow(v)}
                className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
              >
                {savingId === v.id ? "…" : "Enregistrer"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={createVariant} className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-[#E6DCC0] p-3">
        <div className="space-y-1">
          <Label className="text-xs">Nouvelle option (ex. Taille M)</Label>
          <Input required className="h-8 w-32" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SKU</Label>
          <Input required className="h-8 w-32" value={newSku} onChange={(e) => setNewSku(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Stock</Label>
          <Input type="number" min={0} className="h-8 w-24" value={newStock} onChange={(e) => setNewStock(Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prix (optionnel)</Label>
          <Input type="number" min={0} className="h-8 w-28" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={creating}>
          {creating ? "…" : "Ajouter"}
        </Button>
      </form>

      {error && <InlineMessage message={error} />}
    </div>
  )
}
