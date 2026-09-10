"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"

const options = [
  { value: "actif", label: "Actif" },
  { value: "en_attente", label: "En attente" },
  { value: "archive", label: "Archiver" },
]

export function UpdateStatusButtons({
  id,
  current,
}: {
  id: string
  current: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function setStatus(status: string) {
    if (status === current) return
    setLoading(status)
    setError("")
    try {
      const res = await fetch(`/api/adhesions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error || "Mise à jour impossible")
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
            key={opt.value}
            size="sm"
            variant={current === opt.value ? "default" : "outline"}
            className={
              current === opt.value
                ? "bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
                : ""
            }
            disabled={loading !== null}
            onClick={() => void setStatus(opt.value)}
          >
            {loading === opt.value ? "…" : opt.label}
          </Button>
        ))}
      </div>
      {error ? <InlineMessage message={error} /> : null}
    </div>
  )
}
