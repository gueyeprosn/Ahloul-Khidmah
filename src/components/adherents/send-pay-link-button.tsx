"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SendPayLinkButton({
  adherentId,
  tel,
}: {
  adherentId: string
  tel: string
}) {
  const [loading, setLoading] = useState(false)
  const [monthsCount, setMonthsCount] = useState(1)

  async function send() {
    setLoading(true)
    try {
      const res = await fetch("/api/payments/wa-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adherentId, type: "cotisation", monthsCount }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        alert(data.error || "Impossible de préparer le lien WhatsApp")
        return
      }
      window.open(data.url, "_blank", "noopener,noreferrer")
    } finally {
      setLoading(false)
    }
  }

  if (!tel) return null

  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Nombre de mois à régler"
        value={monthsCount}
        onChange={(e) => setMonthsCount(Number(e.target.value))}
        className="h-8 rounded-md border border-[#DED2AE] bg-white px-1.5 text-xs text-[var(--ak-ink)] outline-none focus:ring-2 focus:ring-[var(--ak-emerald-mid)]"
      >
        {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} mois
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
        disabled={loading}
        onClick={() => void send()}
      >
        <MessageCircle className="size-3.5" />
        {loading ? "…" : "Lien paiement WhatsApp"}
      </Button>
    </div>
  )
}
