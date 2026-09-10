"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/shared/section-card"
import { InlineMessage } from "@/components/shared/inline-message"
import { StatusBadge } from "@/components/shared/status-badge"

export function ParametresClient({
  user,
  paydunya,
  whatsapp,
}: {
  user: { name: string; email: string; role: string }
  paydunya: { configured: boolean; mode: string }
  whatsapp: { configured: boolean }
}) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/parametres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      setMessage("Profil mis à jour.")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/parametres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      setCurrentPassword("")
      setNewPassword("")
      setMessage("Mot de passe modifié.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      {error ? <InlineMessage message={error} /> : null}
      {message ? <InlineMessage message={message} variant="success" /> : null}

      <SectionCard
        title="Profil administrateur"
        description={`${user.email} · rôle ${user.role}`}
      >
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom affiché</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
          >
            Enregistrer
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Mot de passe"
        description="Minimum 8 caractères. Conservez-le en lieu sûr."
      >
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <Label htmlFor="current">Mot de passe actuel</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              required
            />
          </div>
          <div>
            <Label htmlFor="next">Nouveau mot de passe</Label>
            <Input
              id="next"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              minLength={8}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
          >
            Changer le mot de passe
          </Button>
        </form>
      </SectionCard>

      <SectionCard
        title="Paiements (PayDunya / SoftPay)"
        description="Wave et Orange Money via SoftPay, sans page PayDunya en live."
      >
        <div className="space-y-3 text-sm text-[var(--ak-ink-soft)]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={paydunya.configured ? "Configuré" : "Clés API manquantes"}
              variant={paydunya.configured ? "success" : "warning"}
            />
            <span>
              Mode <strong className="text-foreground">{paydunya.mode}</strong>
            </span>
          </div>
          <p>
            Renseignez dans le fichier <code>.env</code> :{" "}
            <code>PAYDUNYA_MASTER_KEY</code>, <code>PAYDUNYA_PRIVATE_KEY</code>,{" "}
            <code>PAYDUNYA_TOKEN</code>, puis{" "}
            <code>PAYDUNYA_MODE=live</code> en production.
          </p>
          <p>
            IPN callback :{" "}
            <code className="text-[var(--ak-emerald-deep)]">
              https://www.ahloulkhidmah.org/api/payments/ipn
            </code>
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="WhatsApp Cloud"
        description="Envoi automatique du badge membre après paiement d'adhésion. Renvoi manuel depuis la fiche adhérent."
      >
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ak-ink-soft)]">
          <StatusBadge
            label={whatsapp.configured ? "Configuré" : "Non configuré (lien wa.me)"}
            variant={whatsapp.configured ? "success" : "neutral"}
          />
        </div>
      </SectionCard>
    </div>
  )
}
