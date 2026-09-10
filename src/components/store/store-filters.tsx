"use client"

import { useState } from "react"
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
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
]

function FilterFields({
  values,
  idPrefix,
  layout,
}: {
  values: StoreFilterValues
  idPrefix: string
  layout: "row" | "column"
}) {
  const wrap = layout === "row" ? "flex flex-wrap items-end gap-4" : "space-y-5"
  const fieldWidth = layout === "row" ? "w-40" : "w-full"

  return (
    <div className={wrap}>
      {values.categorie && <input type="hidden" name="categorie" value={values.categorie} />}
      {values.q && <input type="hidden" name="q" value={values.q} />}

      <div className={`${fieldWidth} space-y-1.5`}>
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
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className={`${layout === "row" ? "w-56" : "w-full"} space-y-1.5`}>
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

      <div className={`${fieldWidth} space-y-1.5`}>
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

      <div className={`${layout === "row" ? "" : "w-full"} flex flex-wrap gap-3`}>
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

export function StoreFilters({
  basePath,
  values,
  hasActiveFilters,
}: {
  basePath: string
  values: StoreFilterValues
  hasActiveFilters: boolean
}) {
  const [open, setOpen] = useState(false)
  const resetHref = values.categorie ? `${basePath}?categorie=${values.categorie}` : basePath

  return (
    <>
      {/* Desktop : barre inline */}
      <form method="get" action={basePath} className="hidden rounded-2xl bg-white p-4 md:block">
        <FilterFields values={values} idPrefix="d" layout="row" />
        <div className="mt-4 flex items-center gap-4">
          <button
            type="submit"
            className="rounded-xl bg-[var(--ak-emerald-deep)] px-4 py-2 text-sm font-semibold text-[var(--ak-ivory)] hover:bg-[var(--ak-emerald-mid)]"
          >
            Filtrer
          </button>
          {hasActiveFilters && (
            <a href={resetHref} className="text-sm text-[var(--ak-ink-soft)] underline-offset-2 hover:underline">
              Réinitialiser
            </a>
          )}
        </div>
      </form>

      {/* Mobile : bouton + bottom sheet */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--ak-ink)]/15 bg-white px-4 py-2 text-sm font-medium text-[var(--ak-ink)]"
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
              <FilterFields values={values} idPrefix="m" layout="column" />
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
    </>
  )
}
