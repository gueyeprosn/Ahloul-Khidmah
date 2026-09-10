"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ArchiveProductButton({ productId, active }: { productId: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const confirmMsg = active
      ? "Archiver ce produit ? Il ne sera plus visible dans la boutique."
      : "Réactiver ce produit ?"
    if (!confirm(confirmMsg)) return
    setLoading(true)
    try {
      await fetch(`/api/store/admin/products/${productId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={toggle}>
      {loading ? "…" : active ? "Archiver" : "Réactiver"}
    </Button>
  )
}
