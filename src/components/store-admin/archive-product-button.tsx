"use client"

import { useConfirm } from "@/components/shared/confirm-dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ArchiveProductButton({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  async function toggle() {
    const confirmMsg = active
      ? "Archiver ce produit ? Il ne sera plus visible dans la boutique."
      : "Réactiver ce produit ?"
    if (!(await confirm(confirmMsg, { confirmLabel: active ? "Archiver" : "Réactiver", destructive: active }))) return
    setLoading(true)
    try {
      await fetch(`/api/store/admin/products/${productId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={toggle}>
        {loading ? "…" : active ? "Archiver" : "Réactiver"}
      </Button>
      {confirmDialog}
    </>
  )
}
