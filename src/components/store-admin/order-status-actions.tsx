"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"
import { ORDER_STATUS_LABEL, ORDER_STATUS_TRANSITIONS } from "@/features/store/order-status"

const CONFIRM_MESSAGES: Record<string, string> = {
  CANCELLED: "Annuler cette commande ? Le stock réservé sera relâché.",
  REFUNDED:
    "Confirmez-vous avoir déjà remboursé cette commande (PayDunya, virement...) ? Cette action restocke les articles mais n'exécute aucun remboursement elle-même.",
}

export function OrderStatusActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const options = ORDER_STATUS_TRANSITIONS[status] || []
  if (options.length === 0) return null

  async function setStatus(next: string) {
    const confirmMsg = CONFIRM_MESSAGES[next]
    if (confirmMsg && !confirm(confirmMsg)) return
    setLoading(next)
    setError(null)
    try {
      const res = await fetch(`/api/store/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
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
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt}
            size="sm"
            variant={opt === "CANCELLED" || opt === "REFUNDED" ? "outline" : "default"}
            className={opt !== "CANCELLED" && opt !== "REFUNDED" ? "bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]" : ""}
            disabled={loading !== null}
            onClick={() => void setStatus(opt)}
          >
            {loading === opt ? "…" : ORDER_STATUS_LABEL[opt] || opt}
          </Button>
        ))}
      </div>
      {error && <InlineMessage message={error} />}
    </div>
  )
}
