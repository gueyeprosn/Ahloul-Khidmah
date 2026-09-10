"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/shared/section-card"
import { InlineMessage } from "@/components/shared/inline-message"
import { StatusBadge } from "@/components/shared/status-badge"

export type AdminRow = {
  id: string
  email: string
  name: string
  role: string
  active: boolean
}

export function AdminsPanel({
  currentUserId,
  initial,
}: {
  currentUserId: string
  initial: AdminRow[]
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [ok, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Création impossible")
        return
      }
      setName("")
      setEmail("")
      setPassword("")
      setSuccess("Administrateur créé.")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setError("")
    setSuccess("")
    const res = await fetch("/api/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Mise à jour impossible")
      return
    }
    setSuccess(active ? "Compte réactivé." : "Compte désactivé.")
    router.refresh()
  }

  return (
    <SectionCard
      title="Administrateurs"
      description="Comptes pouvant se connecter au dashboard."
    >
      <form
        onSubmit={createAdmin}
        className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <Label htmlFor="admin-name">Nom</Label>
          <Input
            id="admin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 border-[#DED2AE]"
            required
          />
        </div>
        <div>
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 border-[#DED2AE]"
            required
          />
        </div>
        <div>
          <Label htmlFor="admin-pass">Mot de passe</Label>
          <Input
            id="admin-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 border-[#DED2AE]"
            minLength={8}
            required
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
          >
            Ajouter
          </Button>
        </div>
      </form>
      {error ? <InlineMessage message={error} /> : null}
      {ok ? <InlineMessage message={ok} variant="success" /> : null}

      <ul className="space-y-2 text-sm">
        {initial.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E6DCC0] bg-white px-3 py-2"
          >
            <div>
              <p className="font-medium text-[var(--ak-emerald-deep)]">
                {a.name}
                {a.id === currentUserId ? " (vous)" : ""}
              </p>
              <p className="text-xs text-muted-foreground">{a.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge
                label={a.active ? "Actif" : "Désactivé"}
                variant={a.active ? "success" : "neutral"}
              />
              {a.id !== currentUserId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void toggleActive(a.id, !a.active)}
                >
                  {a.active ? "Désactiver" : "Réactiver"}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
