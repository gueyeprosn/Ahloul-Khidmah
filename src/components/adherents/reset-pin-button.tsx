"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ResetPinButton({
  adherentId,
  hasPin,
}: {
  adherentId: string
  hasPin: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!hasPin) return null

  async function reset() {
    if (
      !confirm(
        "Réinitialiser le code PIN de cet adhérent ? Il pourra se reconnecter avec les 4 derniers caractères de son N° membre, le temps d'en choisir un nouveau."
      )
    ) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/adherents/${adherentId}/reset-pin`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        alert(data.error || "Impossible de réinitialiser le PIN")
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={() => void reset()}
    >
      <KeyRound className="size-3.5" />
      {loading ? "…" : "Réinitialiser le PIN"}
    </Button>
  )
}
