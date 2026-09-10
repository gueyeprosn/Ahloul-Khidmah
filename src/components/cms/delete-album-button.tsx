"use client"

import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteAlbumButton({
  albumId,
  albumKey,
}: {
  albumId: string
  albumKey: string
}) {
  const router = useRouter()
  const locked = albumKey === "vision" || albumKey === "galerie"

  async function onDelete() {
    if (locked) return
    if (!confirm("Supprimer cet album et ses photos ?")) return
    const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || "Suppression impossible")
      return
    }
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={locked}
      title={locked ? "Album système (Vision / Galerie)" : "Supprimer"}
      onClick={() => void onDelete()}
    >
      <Trash2 className="size-3.5" />
    </Button>
  )
}
