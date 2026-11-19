"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Camera, Download, Loader2, Share2, X } from "lucide-react"
import type { MemberBadgeData } from "@/lib/member-badge"
import {
  dataUrlToFile,
  downloadDataUrl,
  renderMemberBadgePng,
} from "@/lib/member-badge-client"

type Props = {
  member: {
    id: string
    prenoms: string
    nom: string
    celluleLocale?: string | null
    zoneRegion?: string | null
    tel?: string | null
    whatsapp?: string | null
    memberNumber?: number | null
    photoUrl: string | null
  }
  photoUploading: boolean
  photoError: string | null
  /** Conservé pour compatibilité : le parcours photo passe par onOpenPhoto. */
  onPhotoSelected?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenPhoto?: () => void
  onClose: () => void
}

/**
 * Carte membre en PLEIN ÉCRAN : la carte occupe tout l'écran (aussi grande que
 * possible, sans être déformée), avec le bouton « Fermer » posé sur la carte.
 * L'image de la carte est générée par renderMemberBadgePng (design et
 * dimensions inchangés — voir README § 10) ; seule la mise en page autour change.
 */
export function BadgeFullscreen({
  member,
  photoUploading,
  photoError,
  onOpenPhoto,
  onClose,
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<"download" | "share" | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const input: MemberBadgeData = useMemo(
    () => ({
      id: member.id,
      prenoms: member.prenoms,
      nom: member.nom,
      celluleLocale: member.celluleLocale,
      zoneRegion: member.zoneRegion,
      tel: member.tel,
      whatsapp: member.whatsapp,
      validationUrl: `${window.location.origin}/valider/${encodeURIComponent(member.id)}`,
      memberNumber: member.memberNumber,
      photoUrl: member.photoUrl,
    }),
    [member]
  )

  // Génère l'image de la carte (et la régénère si la photo change).
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => setLoading(true), 0)
    void renderMemberBadgePng(input)
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [input])

  // Échap ferme ; la page derrière ne défile pas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const filename = `ahloul-khidmah-carte-${member.id}.png`

  const onDownload = useCallback(async () => {
    if (!dataUrl) return
    setBusy("download")
    downloadDataUrl(dataUrl, filename)
    setMsg("Carte téléchargée.")
    setBusy(null)
  }, [dataUrl, filename])

  const onShare = useCallback(async () => {
    if (!dataUrl) return
    setBusy("share")
    setMsg(null)
    try {
      const file = dataUrlToFile(dataUrl, filename)
      const data: ShareData = {
        files: [file],
        title: "Ma carte membre Ahloul Khidmah",
        text: "Voici ma carte membre Ahloul Khidmah.",
      }
      if (navigator.canShare?.(data)) await navigator.share(data)
      else {
        downloadDataUrl(dataUrl, filename)
        setMsg("Carte téléchargée.")
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) setMsg("Partage impossible.")
    } finally {
      setBusy(null)
    }
  }, [dataUrl, filename])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ma carte membre"
      className="fixed inset-0 z-[110] flex flex-col bg-[#061F14]"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Zone de la carte : elle prend toute la place disponible. */}
      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        <div className="relative max-h-full max-w-full">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={`Carte membre ${member.prenoms} ${member.nom}`}
              className="block max-h-[calc(100dvh-7.5rem)] max-w-[calc(100vw-1.5rem)] rounded-2xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            />
          ) : (
            <div className="flex aspect-[680/1080] h-[calc(100dvh-7.5rem)] max-w-[calc(100vw-1.5rem)] items-center justify-center rounded-2xl bg-[var(--ak-ivory)] text-sm text-[var(--ak-ink-soft)]">
              {loading ? (
                <Loader2 className="size-7 animate-spin text-[var(--ak-emerald-mid)]" />
              ) : (
                "Aperçu indisponible"
              )}
            </div>
          )}

          {/* Bouton fermer SUR la carte, en haut à droite. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la carte"
            className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-white/95 text-[var(--ak-emerald-deep)] shadow-lg ring-1 ring-black/10 active:scale-95"
          >
            <X className="size-6" aria-hidden />
          </button>

          {photoUploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Actions discrètes sous la carte. */}
      <div className="shrink-0 px-3 pb-3">
        {msg || photoError ? (
          <p className="mb-2 text-center text-xs text-[var(--ak-gold-light)]">{photoError || msg}</p>
        ) : null}
        <div className="mx-auto flex max-w-sm gap-2">
          <button
            type="button"
            onClick={() => void onDownload()}
            disabled={!dataUrl || busy !== null}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--ak-gold)] px-3 text-sm font-semibold text-[var(--ak-emerald-deep)] disabled:opacity-50"
          >
            {busy === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Télécharger
          </button>
          <button
            type="button"
            onClick={() => void onShare()}
            disabled={!dataUrl || busy !== null}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--ak-gold)] px-3 text-sm font-semibold text-[var(--ak-gold-light)] disabled:opacity-50"
          >
            {busy === "share" ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
            Partager
          </button>
          {onOpenPhoto ? (
            <button
              type="button"
              onClick={onOpenPhoto}
              aria-label={member.photoUrl ? "Changer ma photo" : "Ajouter ma photo"}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--ak-gold)] text-[var(--ak-gold-light)]"
            >
              <Camera className="size-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
