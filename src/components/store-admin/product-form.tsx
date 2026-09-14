"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"
import { slugFromName } from "@/features/store/product-schema"

export type ProductFormValues = {
  name: string
  slug: string
  sku: string
  description: string
  price: number
  compareAtPrice: number | null
  categoryId: string | null
  stock: number
  lowStockThreshold: number
  limitedEdition: boolean
  limitedTotal: number | null
  preorder: boolean
  active: boolean
  featured: boolean
  isNew: boolean
}

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: 0,
  compareAtPrice: null,
  categoryId: null,
  stock: 0,
  lowStockThreshold: 5,
  limitedEdition: false,
  limitedTotal: null,
  preorder: false,
  active: true,
  featured: false,
  isNew: false,
}

export function ProductForm({
  mode,
  productId,
  categories,
  initial,
}: {
  mode: "create" | "edit"
  productId?: string
  categories: { id: string; name: string }[]
  initial?: Partial<ProductFormValues>
}) {
  const router = useRouter()
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial })
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleNameChange(name: string) {
    set("name", name)
    if (!slugTouched) set("slug", slugFromName(name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const url = mode === "create" ? "/api/store/admin/products" : `/api/store/admin/products/${productId}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors de l'enregistrement")
        setSubmitting(false)
        return
      }
      if (mode === "create") {
        router.push(`/admin/boutique/produits/${data.product.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pf-name">Nom</Label>
          <Input id="pf-name" required value={values.name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-slug">Slug (URL)</Label>
          <Input
            id="pf-slug"
            required
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set("slug", e.target.value)
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-sku">SKU</Label>
          <Input id="pf-sku" required value={values.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-category">Catégorie</Label>
          <select
            id="pf-category"
            value={values.categoryId ?? ""}
            onChange={(e) => set("categoryId", e.target.value || null)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="">— Aucune —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pf-description">Description</Label>
        <Textarea id="pf-description" required rows={4} value={values.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="pf-price">Prix (FCFA)</Label>
          <Input id="pf-price" required type="number" min={0} value={values.price} onChange={(e) => set("price", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-compare-price">Prix barré (optionnel)</Label>
          <Input
            id="pf-compare-price"
            type="number"
            min={0}
            value={values.compareAtPrice ?? ""}
            onChange={(e) => set("compareAtPrice", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-stock">Stock</Label>
          <Input id="pf-stock" required type="number" min={0} value={values.stock} onChange={(e) => set("stock", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-threshold">Seuil stock faible</Label>
          <Input id="pf-threshold" required type="number" min={0} value={values.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.active} onCheckedChange={(v) => set("active", Boolean(v))} />
          Actif (visible en boutique)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.featured} onCheckedChange={(v) => set("featured", Boolean(v))} />
          Mis en avant
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.isNew} onCheckedChange={(v) => set("isNew", Boolean(v))} />
          Nouveauté
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.limitedEdition}
            onCheckedChange={(v) => set("limitedEdition", Boolean(v))}
          />
          Édition limitée
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.preorder}
            onCheckedChange={(v) => set("preorder", Boolean(v))}
          />
          Précommande (reste commandable à stock épuisé)
        </label>
      </div>

      {values.limitedEdition && (
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="pf-limited-total">Nombre total (édition limitée)</Label>
          <Input
            id="pf-limited-total"
            type="number"
            min={0}
            value={values.limitedTotal ?? ""}
            onChange={(e) => set("limitedTotal", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      )}

      {error && <InlineMessage message={error} />}

      <Button type="submit" disabled={submitting} className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]">
        {submitting ? "Enregistrement…" : mode === "create" ? "Créer le produit" : "Enregistrer"}
      </Button>
    </form>
  )
}
