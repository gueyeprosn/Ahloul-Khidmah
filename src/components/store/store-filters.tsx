"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SlidersHorizontal, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"

export type StoreFilterValues = {
  categorie?: string
  q?: string
  prixMin?: string
  prixMax?: string
  disponibilite?: string
  promo?: boolean
  edition?: boolean
  nouveau?: boolean
  tri?: string
}

const SORT_OPTIONS = [
  { value: "pertinence", label: "Pertinence" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix_asc", label: "Prix ↑" },
  { value: "prix_desc", label: "Prix ↓" },
]

function FilterFields({
  values,
  idPrefix,
}: {
  values: StoreFilterValues
  idPrefix: string
}) {
  return (
    <div className="space-y-5">
      {values.categorie && <input type="hidden" name="categorie" value={values.categorie} />}
      {values.q && <input type="hidden" name="q" value={values.q} />}

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-tri`} className="text-sm font-medium text-[var(--ak-ink)]">
          Trier par
        </label>
        <select
          id={`${idPrefix}-tri`}
          name="tri"
          defaultValue={values.tri || "pertinence"}
          className="h-9 w-full rounded-lg border border-[var(--ak-ink)]/15 bg-white px-3 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-[var(--ak-ink)]">Prix (FCFA)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            name="prixMin"
            placeholder="Min"
            defaultValue={values.prixMin}
            aria-label="Prix minimum"
            className="h-9 w-full rounded-lg border border-[var(--ak-ink)]/15 bg-white px-3 text-sm"
          />
          <span className="text-[var(--ak-ink-soft)]">—</span>
          <input
            type="number"
            min={0}
            name="prixMax"
            placeholder="Max"
            defaultValue={values.prixMax}
            aria-label="Prix maximum"
            className="h-9 w-full rounded-lg border border-[var(--ak-ink)]/15 bg-white px-3 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-dispo`} className="text-sm font-medium text-[var(--ak-ink)]">
          Disponibilité
        </label>
        <select
          id={`${idPrefix}-dispo`}
          name="disponibilite"
          defaultValue={values.disponibilite || "all"}
          className="h-9 w-full rounded-lg border border-[var(--ak-ink)]/15 bg-white px-3 text-sm"
        >
          <option value="all">Tous les produits</option>
          <option value="in_stock">En stock</option>
          <option value="low_stock">Stock faible</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-1.5 text-sm text-[var(--ak-ink)]">
          <input type="checkbox" name="promo" value="true" defaultChecked={values.promo} />
          Promotion
        </label>
        <label className="flex items-center gap-1.5 text-sm text-[var(--ak-ink)]">
          <input type="checkbox" name="edition" value="true" defaultChecked={values.edition} />
          Édition limitée
        </label>
        <label className="flex items-center gap-1.5 text-sm text-[var(--ak-ink)]">
          <input type="checkbox" name="nouveau" value="true" defaultChecked={values.nouveau} />
          Nouveauté
        </label>
      </div>
    </div>
  )
}

function buildSortHref(basePath: string, values: StoreFilterValues, tri: string) {
  const params = new URLSearchParams()
  if (values.categorie) params.set("categorie", values.categorie)
  if (values.q) params.set("q", values.q)
  if (values.prixMin) params.set("prixMin", values.prixMin)
  if (values.prixMax) params.set("prixMax", values.prixMax)
  if (values.disponibilite && values.disponibilite !== "all") {
    params.set("disponibilite", values.disponibilite)
  }
  if (values.promo) params.set("promo", "true")
  if (values.edition) params.set("edition", "true")
  if (values.nouveau) params.set("nouveau", "true")
  if (tri && tri !== "pertinence") params.set("tri", tri)
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function StoreFilters({
  basePath,
  values,
  hasActiveFilters,
}: {
  basePath: string
  values: StoreFilterValues
  hasActiveFilters: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const resetHref = values.categorie
    ? `${basePath}?categorie=${values.categorie}`
    : values.q
      ? `${basePath}?q=${encodeURIComponent(values.q)}`
      : basePath

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="store-sort-quick">
        Trier
      </label>
      <select
        id="store-sort-quick"
        value={values.tri || "pertinence"}
        onChange={(e) => router.push(buildSortHref(basePath, values, e.target.value))}
        className="h-9 rounded-full border border-[var(--ak-ink)]/15 bg-white px-3 text-sm text-[var(--ak-ink)] outline-none focus:border-[var(--ak-emerald-mid)]"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--ak-ink)]/15 bg-white px-3.5 py-2 text-sm font-medium text-[var(--ak-ink)]"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filtres
        {hasActiveFilters && <span className="size-1.5 rounded-full bg-[var(--ak-gold)]" />}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
          <SheetHeader className="border-b border-[#E6DCC0]">
            <SheetTitle className="font-[family-name:var(--font-amiri)] text-lg text-[var(--ak-emerald-deep)]">
              Filtres
            </SheetTitle>
          </SheetHeader>
          <form method="get" action={basePath} className="flex-1 overflow-y-auto px-4 pb-4">
            <FilterFields values={values} idPrefix="f" />
            <SheetFooter className="sticky bottom-0 mt-5 bg-white px-0 pt-2">
              <button
                type="submit"
                className="ak-cta-solid flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Voir les résultats
              </button>
              {hasActiveFilters && (
                <a
                  href={resetHref}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--ak-ink)]/15 px-4 py-2.5 text-sm font-medium text-[var(--ak-ink)]"
                >
                  <X className="size-3.5" aria-hidden />
                  Réinitialiser
                </a>
              )}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
