"use client"

import { useState } from "react"
import { Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"

export function ResendBadgeButton({ adherentId }: { adherentId: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  async function onResend() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/adherents/${adherentId}/resend-badge`, {
        method: "POST",
      })
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string }
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Échec de l'envoi" })
        return
      }
      setMsg({
        type: "success",
        text: data.message || "Badge renvoyé sur WhatsApp.",
      })
    } catch {
      setMsg({ type: "error", text: "Erreur réseau" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => void onResend()}
        className="border-[var(--ak-emerald-deep)] text-[var(--ak-emerald-deep)]"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <MessageCircle className="size-3.5" />
        )}
        Renvoyer le badge (WhatsApp / email)
      </Button>
      {msg ? <InlineMessage message={msg.text} variant={msg.type} /> : null}
    </div>
  )
}
