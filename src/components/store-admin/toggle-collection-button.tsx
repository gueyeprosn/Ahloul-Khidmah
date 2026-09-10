"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ToggleCollectionButton({ collectionId, active }: { collectionId: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const confirmMsg = active
      ? "Désactiver cette collection ? Elle ne sera plus visible côté boutique."
      : "Réactiver cette collection ?"
    if (!confirm(confirmMsg)) return
    setLoading(true)
    try {
      await fetch(`/api/store/admin/collections/${collectionId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={toggle}>
      {loading ? "…" : active ? "Désactiver" : "Réactiver"}
    </Button>
  )
}
