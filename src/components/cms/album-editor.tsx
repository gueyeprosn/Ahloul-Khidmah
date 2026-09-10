"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Trash2,
  Upload,
} from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SectionCard } from "@/components/shared/section-card"
import { InlineMessage } from "@/components/shared/inline-message"
import { StatusBadge } from "@/components/shared/status-badge"

type PhotoRow = {
  id: string
  src: string
  alt: string
  caption: string | null
  published: boolean
  sortOrder: number
}

type AlbumMeta = {
  id: string
  key: string
  title: string
  description: string | null
  published: boolean
}

export function AlbumEditor({
  album,
  photos,
}: {
  album: AlbumMeta
  photos: PhotoRow[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(album.title)
  const [description, setDescription] = useState(album.description || "")
  const [published, setPublished] = useState(album.published)
  const [alt, setAlt] = useState("")
  const [caption, setCaption] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  )

  async function saveAlbum(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, published }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Erreur" })
        return
      }
      setMsg({ type: "success", text: "Album enregistré." })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setMsg({ type: "error", text: "Choisissez une image" })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const up = await fetch("/api/medias/upload", { method: "POST", body: fd })
      const upData = await up.json()
      if (!up.ok) {
        setMsg({ type: "error", text: upData.error || "Upload échoué" })
        return
      }
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: album.id,
          src: upData.src,
          alt: alt || file.name,
          caption,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Erreur" })
        return
      }
      setAlt("")
      setCaption("")
      if (fileRef.current) fileRef.current.value = ""
      setMsg({ type: "success", text: "Photo ajoutée." })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function patchPhoto(id: string, body: Record<string, unknown>) {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/photos/${id}`, {
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

  async function removePhoto(id: string) {
    if (!confirm("Supprimer cette photo ?")) return
    setLoading(true)
    try {
      await fetch(`/api/photos/${id}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {msg ? <InlineMessage message={msg.text} variant={msg.type} /> : null}

      <SectionCard title="Paramètres de l'album">
        <form onSubmit={saveAlbum} className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 border-[#DED2AE] bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={published}
              onCheckedChange={(v) => setPublished(v === true)}
            />
            Album publié sur le site
          </label>
          <div className="flex items-center gap-2">
            <StatusBadge
              label={`Clé : ${album.key}`}
              variant="neutral"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Ajouter une photo">
        <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Label htmlFor="file">Fichier</Label>
            <Input
              id="file"
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-1.5 border-[#DED2AE] bg-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="alt">Texte alternatif</Label>
            <Input
              id="alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="mt-1.5 border-[#DED2AE] bg-white"
              placeholder="Description de l'image"
            />
          </div>
          <div>
            <Label htmlFor="caption">Légende</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1.5 border-[#DED2AE] bg-white"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
            >
              <Upload className="size-3.5" />
              Uploader
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Photos"
        description="Ordre d'affichage sur le site public."
      >
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune photo dans cet album.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p, i) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border border-[#E6DCC0] bg-[var(--ak-ivory)]"
              >
                <div className="relative aspect-[4/3]">
                  <AppImage
                    src={p.src}
                    alt={p.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="space-y-2 p-3">
                    <Input
                      defaultValue={p.alt}
                      placeholder="Texte alternatif"
                      className="h-8 border-[#DED2AE] text-xs"
                      onBlur={(e) => {
                        const next = e.target.value.trim()
                        if (next && next !== p.alt) {
                          void patchPhoto(p.id, { alt: next })
                        }
                      }}
                    />
                    <Input
                      defaultValue={p.caption || ""}
                      placeholder="Légende"
                      className="h-8 border-[#DED2AE] text-xs"
                      onBlur={(e) => {
                        const next = e.target.value.trim()
                        if (next !== (p.caption || "")) {
                          void patchPhoto(p.id, { caption: next })
                        }
                      }}
                    />
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading || i === 0}
                      onClick={() =>
                        void patchPhoto(p.id, { action: "move", dir: "up" })
                      }
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading || i === photos.length - 1}
                      onClick={() =>
                        void patchPhoto(p.id, { action: "move", dir: "down" })
                      }
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() =>
                        void patchPhoto(p.id, { published: !p.published })
                      }
                    >
                      {p.published ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={loading}
                      onClick={() => void removePhoto(p.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <StatusBadge
                    label={p.published ? "Publiée" : "Masquée"}
                    variant={p.published ? "success" : "neutral"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
