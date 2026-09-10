"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/shared/section-card"
import { InlineMessage } from "@/components/shared/inline-message"

export function CreateAlbumForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [key, setKey] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, key, description }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      setTitle("")
      setKey("")
      setDescription("")
      setSuccess("Album créé.")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <SectionCard title="Nouvel album" description="Clé unique (ex: magal-2026).">
      <form
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 border-[#DED2AE] bg-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="key">Clé (optionnel)</Label>
          <Input
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="auto"
            className="mt-1.5 border-[#DED2AE] bg-white font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="desc">Description</Label>
          <Input
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 border-[#DED2AE] bg-white"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
          >
            Créer
          </Button>
        </div>
      </form>
      {error ? <InlineMessage className="mt-3" message={error} /> : null}
      {success ? (
        <InlineMessage className="mt-3" message={success} variant="success" />
      ) : null}
    </SectionCard>
  )
}
