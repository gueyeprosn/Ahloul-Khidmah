"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--ak-emerald-mid)] focus-visible:ring-4 focus-visible:ring-[var(--ak-emerald-mid)]/40 focus-visible:outline-none"
    >
      <Printer className="size-5" aria-hidden />
      Imprimer / PDF
    </button>
  )
}
