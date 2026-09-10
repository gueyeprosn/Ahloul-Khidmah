"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ReviewModerationActions({ reviewId, status }: { reviewId: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function setStatus(next: string) {
    setLoading(next)
    try {
      await fetch(`/api/store/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      {status !== "APPROVED" && (
        <Button
          size="sm"
          disabled={loading !== null}
          onClick={() => setStatus("APPROVED")}
          className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
        >
          {loading === "APPROVED" ? "…" : "Approuver"}
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => setStatus("REJECTED")}>
          {loading === "REJECTED" ? "…" : "Rejeter"}
        </Button>
      )}
    </div>
  )
}
