"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, MapPin, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/shared/empty-state"
import { InlineMessage } from "@/components/shared/inline-message"
import { SectionCard } from "@/components/shared/section-card"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"

type CelluleRow = {
  id: string
  name: string
  zone: string | null
  count: number
}

export function CellulesClient({ initial }: { initial: CelluleRow[] }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [zone, setZone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editZone, setEditZone] = useState("")

  async function createCellule(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    try {
      const res = await fetch("/api/cellules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, zone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      setName("")
      setZone("")
      setSuccess("Cellule créée.")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function startEdit(c: CelluleRow) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditZone(c.zone || "")
    setError("")
    setSuccess("")
  }

  async function saveEdit(id: string) {
    setError("")
    setSuccess("")
    const res = await fetch(`/api/cellules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, zone: editZone }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Mise à jour impossible")
      return
    }
    setEditingId(null)
    setSuccess("Cellule mise à jour.")
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette cellule ?")) return
    setError("")
    setSuccess("")
    const res = await fetch(`/api/cellules/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Suppression impossible")
      return
    }
    setSuccess("Cellule supprimée.")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Nouvelle cellule" description="Organisation territoriale.">
        <form
          onSubmit={createCellule}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <Label htmlFor="name">Nom de la cellule</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dakar Plateau"
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
              required
            />
          </div>
          <div>
            <Label htmlFor="zone">Zone / Région</Label>
            <Input
              id="zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ex: Dakar"
              className="mt-1.5 border-[#DED2AE] bg-[var(--ak-ivory)]"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)] sm:w-auto"
            >
              <Plus className="size-3.5" />
              Ajouter
            </Button>
          </div>
        </form>
        {error ? <InlineMessage className="mt-3" message={error} /> : null}
        {success ? (
          <InlineMessage className="mt-3" message={success} variant="success" />
        ) : null}
      </SectionCard>

      {initial.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Aucune cellule"
          description="Elles sont aussi créées automatiquement à l'adhésion."
        />
      ) : (
        <DataTable>
          <DataTableRoot>
            <DataTableHead>
              <Th>Cellule</Th>
              <Th>Zone</Th>
              <Th>Adhérents</Th>
              <Th />
            </DataTableHead>
            <DataTableBody>
              {initial.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-[var(--ak-emerald-deep)]">
                    {editingId === c.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 border-[#DED2AE]"
                      />
                    ) : (
                      <Link
                        href={`/adherents?q=${encodeURIComponent(c.name)}`}
                        className="hover:underline"
                      >
                        {c.name}
                      </Link>
                    )}
                  </Td>
                  <Td className="text-muted-foreground">
                    {editingId === c.id ? (
                      <Input
                        value={editZone}
                        onChange={(e) => setEditZone(e.target.value)}
                        className="h-8 border-[#DED2AE]"
                      />
                    ) : (
                      c.zone || "—"
                    )}
                  </Td>
                  <Td className="tabular-nums">{c.count}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      {editingId === c.id ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void saveEdit(c.id)}
                          >
                            <Check className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(c)}
                            title="Modifier"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void remove(c.id)}
                            disabled={c.count > 0}
                            title={
                              c.count > 0
                                ? "Des adhérents sont liés"
                                : "Supprimer"
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </DataTable>
      )}
    </div>
  )
}
