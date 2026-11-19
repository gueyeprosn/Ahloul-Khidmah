"use client"

import { useConfirm } from "@/components/shared/confirm-dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ToggleCollectionButton({ collectionId, active }: { collectionId: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  async function toggle() {
    const confirmMsg = active
      ? "Désactiver cette collection ? Elle ne sera plus visible côté boutique."
      : "Réactiver cette collection ?"
    const ok = await confirm(confirmMsg, {
      confirmLabel: active ? "Désactiver" : "Réactiver",
      destructive: active,
    })
    if (!ok) return
    setLoading(true)
    try {
      await fetch(`/api/store/admin/collections/${collectionId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={toggle}>
        {loading ? "…" : active ? "Désactiver" : "Réactiver"}
      </Button>
      {confirmDialog}
    </>
  )
}
