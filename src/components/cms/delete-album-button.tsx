"use client"

import { useConfirm } from "@/components/shared/confirm-dialog"
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
  const [confirm, confirmDialog] = useConfirm()
  const locked = albumKey === "vision" || albumKey === "galerie"

  async function onDelete() {
    if (locked) return
    const ok = await confirm("Supprimer cet album et ses photos ?", {
      title: "Supprimer l'album",
      confirmLabel: "Supprimer",
      destructive: true,
    })
    if (!ok) return
    const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || "Suppression impossible")
      return
    }
    router.refresh()
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        disabled={locked}
        aria-label="Supprimer l'album"
        title={locked ? "Album système (Vision / Galerie)" : "Supprimer"}
        onClick={() => void onDelete()}
      >
        <Trash2 className="size-3.5" />
      </Button>
      {confirmDialog}
    </>
  )
}
