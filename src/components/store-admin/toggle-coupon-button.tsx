"use client"

import { useConfirm } from "@/components/shared/confirm-dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ToggleCouponButton({ couponId, active }: { couponId: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  async function toggle() {
    const confirmMsg = active
      ? "Désactiver ce coupon ? Il ne pourra plus être utilisé."
      : "Réactiver ce coupon ?"
    const ok = await confirm(confirmMsg, {
      confirmLabel: active ? "Désactiver" : "Réactiver",
      destructive: active,
    })
    if (!ok) return
    setLoading(true)
    try {
      await fetch(`/api/store/admin/coupons/${couponId}`, { method: "DELETE" })
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
