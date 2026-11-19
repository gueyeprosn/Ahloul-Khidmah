"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-5 text-sm font-semibold text-white"
    >
      <Printer className="size-4" />
      Imprimer / enregistrer en PDF
    </button>
  )
}
