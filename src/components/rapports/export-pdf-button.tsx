"use client"

import { useState } from "react"
import { FileDown, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportPdfButton({
  periodeLabel,
}: {
  periodeLabel: string
}) {
  const [busy, setBusy] = useState(false)

  function exportPdf() {
    setBusy(true)
    const cleanup = () => {
      document.body.classList.remove("ak-printing-rapport")
      window.removeEventListener("afterprint", cleanup)
      setBusy(false)
    }
    document.body.classList.add("ak-printing-rapport")
    window.addEventListener("afterprint", cleanup)
    // Laisse le navigateur peindre les styles print
    window.setTimeout(() => {
      window.print()
      // Fallback si afterprint n'est pas déclenché
      window.setTimeout(cleanup, 1500)
    }, 80)
  }

  return (
    <div className="ak-no-print flex flex-wrap gap-2">
      <Button
        size="sm"
        type="button"
        disabled={busy}
        className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
        onClick={exportPdf}
      >
        <FileDown className="size-3.5" />
        {busy ? "Préparation…" : "Exporter PDF"}
      </Button>
      <Button
        size="sm"
        type="button"
        variant="outline"
        disabled={busy}
        onClick={exportPdf}
      >
        <Printer className="size-3.5" />
        Imprimer — {periodeLabel}
      </Button>
    </div>
  )
}
