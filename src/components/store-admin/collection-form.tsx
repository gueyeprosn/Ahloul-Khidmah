"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"
import { AppImage } from "@/components/media/app-image"

export type CollectionFormValues = {
  slug: string
  name: string
  tagline: string
  description: string
  type: "PERMANENTE" | "SAISONNIERE" | "EVENEMENTIELLE" | "LIMITEE" | "MEMBRE" | "SOLIDAIRE"
  coverImage: string
  bannerImage: string
  accentColor: string
  active: boolean
  startsAt: string
  endsAt: string
  sortOrder: number
}

const EMPTY: CollectionFormValues = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  type: "PERMANENTE",
  coverImage: "",
  bannerImage: "",
  accentColor: "",
  active: true,
  startsAt: "",
  endsAt: "",
  sortOrder: 0,
}

const TYPE_OPTIONS: { value: CollectionFormValues["type"]; label: string }[] = [
  { value: "PERMANENTE", label: "Permanente" },
  { value: "SAISONNIERE", label: "Saisonnière" },
  { value: "EVENEMENTIELLE", label: "Événementielle" },
  { value: "LIMITEE", label: "Édition limitée" },
  { value: "MEMBRE", label: "Réservée aux membres" },
  { value: "SOLIDAIRE", label: "Solidaire" },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function ImagePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/medias/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.src) {
        onChange(data.src)
      }
      if (fileRef.current) fileRef.current.value = ""
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {value ? (
        <div className="group relative h-28 w-full max-w-xs overflow-hidden rounded-xl border border-[#E6DCC0]">
          <AppImage src={value} alt={label} fill sizes="320px" className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Retirer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex h-28 w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E6DCC0] text-xs text-[var(--ak-ink-soft)] hover:border-[var(--ak-gold)]">
          <Upload className="size-4" />
          {uploading ? "…" : "Ajouter une image"}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUpload(file)
            }}
          />
        </label>
      )}
    </div>
  )
}

export function CollectionForm({
  mode,
  collectionId,
  initial,
}: {
  mode: "create" | "edit"
  collectionId?: string
  initial?: Partial<CollectionFormValues>
}) {
  const router = useRouter()
  const [values, setValues] = useState<CollectionFormValues>({ ...EMPTY, ...initial })
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CollectionFormValues>(key: K, value: CollectionFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const url = mode === "create" ? "/api/store/admin/collections" : `/api/store/admin/collections/${collectionId}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          startsAt: values.startsAt || undefined,
          endsAt: values.endsAt || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors de l'enregistrement")
        setSubmitting(false)
        return
      }
      if (mode === "create") {
        router.push(`/admin/boutique/collections/${data.collection.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="col-name">Nom</Label>
          <Input
            id="col-name"
            required
            value={values.name}
            onChange={(e) => {
              const name = e.target.value
              set("name", name)
              if (!slugTouched) set("slug", slugify(name))
            }}
            placeholder="Ex. Collection Ramadan"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="col-slug">Slug</Label>
          <Input
            id="col-slug"
            required
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set("slug", slugify(e.target.value))
            }}
            placeholder="collection-ramadan"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="col-tagline">Accroche (optionnel)</Label>
        <Input
          id="col-tagline"
          value={values.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          placeholder="Une courte phrase d'accroche"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="col-description">Description</Label>
        <textarea
          id="col-description"
          required
          rows={5}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
          placeholder="Présentez la collection…"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="col-type">Type</Label>
          <select
            id="col-type"
            value={values.type}
            onChange={(e) => set("type", e.target.value as CollectionFormValues["type"])}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="col-accent">Couleur d&apos;accent (optionnel)</Label>
          <Input
            id="col-accent"
            type="text"
            value={values.accentColor}
            onChange={(e) => set("accentColor", e.target.value)}
            placeholder="#0F6B4C"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ImagePicker label="Image de couverture" value={values.coverImage} onChange={(url) => set("coverImage", url)} />
        <ImagePicker label="Bannière (page détail)" value={values.bannerImage} onChange={(url) => set("bannerImage", url)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="col-starts">Début (optionnel)</Label>
          <Input
            id="col-starts"
            type="datetime-local"
            value={values.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="col-ends">Fin (optionnel)</Label>
          <Input
            id="col-ends"
            type="datetime-local"
            value={values.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="col-sort">Ordre d&apos;affichage</Label>
          <Input
            id="col-sort"
            type="number"
            min={0}
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={values.active} onCheckedChange={(v) => set("active", Boolean(v))} />
        Active
      </label>

      {error && <InlineMessage message={error} />}

      <Button type="submit" disabled={submitting} className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]">
        {submitting ? "Enregistrement…" : mode === "create" ? "Créer la collection" : "Enregistrer"}
      </Button>
    </form>
  )
}
