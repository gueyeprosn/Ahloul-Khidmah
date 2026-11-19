"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DESTINATIONS = [
  { value: "", label: "Page d'accueil", web: "/mon-espace" },
  { value: "/pay", label: "Payer ma cotisation", web: "/mon-espace" },
  { value: "/card", label: "Ma carte membre", web: "/mon-espace" },
]

export function SendPushForm({ configured, devices }: { configured: boolean; devices: number }) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [dest, setDest] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    if (!window.confirm(`Envoyer cette notification à ${devices} appareil(s) ?`)) return
    setBusy(true)
    setMessage(null)
    try {
      const d = DESTINATIONS[dest]
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, route: d.value, webPath: d.web, audience: "all" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "Envoi impossible." })
        return
      }
      setMessage({
        ok: true,
        text: `Envoyée : ${data.sent} sur ${data.targeted} appareil(s)${data.removed ? `, ${data.removed} périmé(s) retiré(s)` : ""}.`,
      })
      setTitle("")
      setBody("")
    } catch {
      setMessage({ ok: false, text: "Erreur réseau. Réessayez." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border bg-card p-5">
      {!configured ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Le compte de service Firebase n&apos;est pas configuré sur le serveur : l&apos;envoi est désactivé.
        </p>
      ) : null}
      <div>
        <Label htmlFor="push-title">Titre (60 caractères max)</Label>
        <Input id="push-title" value={title} maxLength={60} required minLength={2} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="push-body">Message (240 caractères max)</Label>
        <textarea
          id="push-body"
          value={body}
          maxLength={240}
          minLength={2}
          required
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Il s&apos;affiche sur l&apos;écran verrouillé : n&apos;y mettez ni montant ni donnée personnelle.
        </p>
      </div>
      <div>
        <Label htmlFor="push-dest">Au tap, ouvrir</Label>
        <select
          id="push-dest"
          value={dest}
          onChange={(e) => setDest(Number(e.target.value))}
          className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {DESTINATIONS.map((d, i) => (
            <option key={d.label} value={i}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={busy || !configured || devices === 0}>
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
        Envoyer à tous
      </Button>
      {devices === 0 && configured ? (
        <p className="text-xs text-muted-foreground">Aucun appareil enregistré pour le moment.</p>
      ) : null}
      {message ? (
        <p className={message.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{message.text}</p>
      ) : null}
    </form>
  )
}
