"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"

export function ExportCsvButton() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onExport() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/rapports/export", { method: "POST" })
      if (!res.ok) {
        setError("Export impossible")
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "adherents-ahloul-khidmah.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError("Erreur réseau lors de l'export")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        size="sm"
        type="button"
        disabled={loading}
        className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
        onClick={() => void onExport()}
      >
        <Download className="size-3.5" />
        {loading ? "Export…" : "Export CSV adhérents"}
      </Button>
      {error ? <InlineMessage message={error} /> : null}
    </div>
  )
}
