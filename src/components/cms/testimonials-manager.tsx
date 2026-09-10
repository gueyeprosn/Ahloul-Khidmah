"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SectionCard } from "@/components/shared/section-card"
import { InlineMessage } from "@/components/shared/inline-message"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { MessageSquareQuote } from "lucide-react"

type Row = {
  id: string
  quoteFr: string
  quoteAr: string
  name: string
  roleFr: string
  roleAr: string
  published: boolean
  sortOrder: number
}

const emptyForm = {
  quoteFr: "",
  quoteAr: "",
  name: "",
  roleFr: "",
  roleAr: "",
  published: true,
}

export function TestimonialsManager({ initial }: { initial: Row[] }) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  )

  function startEdit(row: Row) {
    setEditId(row.id)
    setForm({
      quoteFr: row.quoteFr,
      quoteAr: row.quoteAr,
      name: row.name,
      roleFr: row.roleFr,
      roleAr: row.roleAr,
      published: row.published,
    })
  }

  function reset() {
    setEditId(null)
    setForm(emptyForm)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const url = editId ? `/api/temoignages/${editId}` : "/api/temoignages"
      const method = editId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Erreur" })
        return
      }
      setMsg({
        type: "success",
        text: editId ? "Témoignage mis à jour." : "Témoignage créé.",
      })
      reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/temoignages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setMsg({ type: "error", text: data.error || "Erreur" })
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce témoignage ?")) return
    setLoading(true)
    try {
      await fetch(`/api/temoignages/${id}`, { method: "DELETE" })
      if (editId === id) reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {msg ? <InlineMessage message={msg.text} variant={msg.type} /> : null}

      <SectionCard
        title={editId ? "Modifier le témoignage" : "Nouveau témoignage"}
        description="Remplissez FR et AR pour le site bilingue."
        actions={
          editId ? (
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Annuler
            </Button>
          ) : null
        }
      >
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="name">Nom affiché</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1.5 border-[#DED2AE] bg-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="quoteFr">Citation (FR)</Label>
            <Textarea
              id="quoteFr"
              value={form.quoteFr}
              onChange={(e) =>
                setForm((f) => ({ ...f, quoteFr: e.target.value }))
              }
              className="mt-1.5 min-h-24 border-[#DED2AE] bg-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="quoteAr">Citation (AR)</Label>
            <Textarea
              id="quoteAr"
              dir="rtl"
              value={form.quoteAr}
              onChange={(e) =>
                setForm((f) => ({ ...f, quoteAr: e.target.value }))
              }
              className="mt-1.5 min-h-24 border-[#DED2AE] bg-white font-[family-name:var(--font-amiri)]"
              required
            />
          </div>
          <div>
            <Label htmlFor="roleFr">Rôle (FR)</Label>
            <Input
              id="roleFr"
              value={form.roleFr}
              onChange={(e) =>
                setForm((f) => ({ ...f, roleFr: e.target.value }))
              }
              className="mt-1.5 border-[#DED2AE] bg-white"
            />
          </div>
          <div>
            <Label htmlFor="roleAr">Rôle (AR)</Label>
            <Input
              id="roleAr"
              dir="rtl"
              value={form.roleAr}
              onChange={(e) =>
                setForm((f) => ({ ...f, roleAr: e.target.value }))
              }
              className="mt-1.5 border-[#DED2AE] bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <Checkbox
              checked={form.published}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, published: v === true }))
              }
            />
            Publié sur le site
          </label>
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
            >
              <Plus className="size-3.5" />
              {editId ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </SectionCard>

      {initial.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Aucun témoignage"
          description="Ajoutez une citation pour la section Communauté."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {initial.map((row, i) => (
            <article
              key={row.id}
              className="flex flex-col rounded-2xl border border-[#E6DCC0] bg-white p-5"
            >
              <p className="flex-1 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
                « {row.quoteFr} »
              </p>
              <div className="mt-4 border-t border-[#E6DCC0] pt-3">
                <p className="font-semibold text-[var(--ak-emerald-deep)]">
                  {row.name}
                </p>
                <p className="text-xs text-muted-foreground">{row.roleFr}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  <StatusBadge
                    label={row.published ? "Publié" : "Brouillon"}
                    variant={row.published ? "success" : "neutral"}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading || i === 0}
                    onClick={() =>
                      void patch(row.id, { action: "move", dir: "up" })
                    }
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading || i === initial.length - 1}
                    onClick={() =>
                      void patch(row.id, { action: "move", dir: "down" })
                    }
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={() =>
                      void patch(row.id, { published: !row.published })
                    }
                  >
                    {row.published ? (
                      <Eye className="size-3.5" />
                    ) : (
                      <EyeOff className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(row)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => void remove(row.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
