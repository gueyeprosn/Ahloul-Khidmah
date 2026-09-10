"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SoftPayPanel } from "@/components/payments/softpay-panel"

type Props = {
  contributionId: string
  paymentId: string | null
  phone: string
  status: string
}

export function ContributionActions({
  contributionId,
  paymentId,
  phone,
  status,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [softpayId, setSoftpayId] = useState<string | null>(null)

  async function retry() {
    setLoading(true)
    try {
      const res = await fetch(`/api/contributions/${contributionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      })
      const data = (await res.json()) as { paymentId?: string; error?: string }
      if (!res.ok || !data.paymentId) {
        alert(data.error || "Relance impossible")
        return
      }
      setSoftpayId(data.paymentId)
    } finally {
      setLoading(false)
    }
  }

  async function cancel() {
    if (!confirm("Annuler cette contribution en attente ?")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/contributions/${contributionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        alert(data.error || "Annulation impossible")
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (status === "completed") {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {status !== "canceled" ? (
          <Button
            size="sm"
            className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
            disabled={loading}
            onClick={() => {
              if (paymentId) setSoftpayId(paymentId)
              else void retry()
            }}
          >
            {loading ? "…" : "Payer"}
          </Button>
        ) : null}
        {status === "pending" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => void cancel()}
          >
            Annuler
          </Button>
        ) : null}
      </div>

      {softpayId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--ak-ivory)] p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--ak-emerald-deep)]">
                SoftPay — contribution
              </p>
              <Button size="sm" variant="outline" onClick={() => setSoftpayId(null)}>
                Fermer
              </Button>
            </div>
            <SoftPayPanel
              paymentId={softpayId}
              defaultPhone={phone}
              onCompleted={() => {
                setSoftpayId(null)
                router.refresh()
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
