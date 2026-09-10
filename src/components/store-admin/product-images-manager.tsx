"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Upload } from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import { InlineMessage } from "@/components/shared/inline-message"

export type ProductImageData = { id: string; url: string; alt: string }

export function ProductImagesManager({
  productId,
  images,
}: {
  productId: string
  images: ProductImageData[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const up = await fetch("/api/medias/upload", { method: "POST", body: fd })
      const upData = await up.json()
      if (!up.ok) {
        setError(upData.error || "Upload échoué")
        return
      }
      const res = await fetch(`/api/store/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: upData.src, alt: file.name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erreur")
        return
      }
      if (fileRef.current) fileRef.current.value = ""
      router.refresh()
    } catch {
      setError("Erreur réseau")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Supprimer cette image ?")) return
    await fetch(`/api/store/admin/products/${productId}/images?imageId=${encodeURIComponent(imageId)}`, {
      method: "DELETE",
    })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative size-24 overflow-hidden rounded-xl border border-[#E6DCC0]">
            <AppImage src={img.url} alt={img.alt} fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(img.id)}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Supprimer"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E6DCC0] text-xs text-[var(--ak-ink-soft)] hover:border-[var(--ak-gold)]">
          <Upload className="size-4" />
          {uploading ? "…" : "Ajouter"}
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
      </div>
      {error && <InlineMessage message={error} />}
    </div>
  )
}
