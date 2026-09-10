"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, ImageIcon, Loader2, UserRound } from "lucide-react"

type Props = {
  photoUrl: string | null
  name: string
  uploading: boolean
  error: string | null
  onSelected: (e: React.ChangeEvent<HTMLInputElement>) => void
  compact?: boolean
}

export function MemberPhotoUpload({
  photoUrl,
  name,
  uploading,
  error,
  onSelected,
  compact = false,
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [photoUrl])

  const showPhoto = Boolean(photoUrl) && !broken

  return (
    <div
      className={
        compact
          ? "space-y-3 rounded-2xl border border-dashed border-[var(--ak-gold)]/55 bg-[var(--ak-ivory)]/80 p-4"
          : "space-y-4 rounded-2xl border border-[var(--ak-gold)]/35 bg-gradient-to-br from-white to-[var(--ak-ivory)] p-5 shadow-[0_10px_30px_rgba(11,58,37,0.06)]"
      }
    >
      <div className={compact ? "text-center" : ""}>
        <p className="text-sm font-semibold text-[var(--ak-emerald-deep)]">
          Photo de la carte membre
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ak-ink-soft)]">
          {showPhoto
            ? "Cette photo apparaît sur votre carte. Vous pouvez la remplacer."
            : "Ajoutez votre portrait — un emplacement est réservé sur la carte membre."}
        </p>
      </div>

      <div
        className={`flex items-center gap-4 ${compact ? "flex-col" : "sm:items-start"}`}
      >
        <div className="relative">
          <div
            className={`flex items-center justify-center overflow-hidden rounded-full border-[3px] border-[var(--ak-gold)] bg-[#E8F0EA] shadow-[0_0_0_6px_rgba(201,162,76,0.15)] ${
              compact ? "size-28" : "size-24"
            }`}
          >
            {showPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl!}
                alt={`Photo de ${name}`}
                className="h-full w-full object-cover object-center"
                onError={() => setBroken(true)}
              />
            ) : (
              <UserRound
                className={`${compact ? "size-12" : "size-10"} text-[var(--ak-emerald-mid)]/45`}
              />
            )}
          </div>
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[var(--ak-emerald-deep)]/45">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          ) : null}
        </div>

        <div
          className={`flex flex-1 flex-wrap gap-2 ${compact ? "justify-center" : ""}`}
        >
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ak-emerald-deep)] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            <Camera className="size-3.5" />
            Prendre une photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ak-emerald-deep)] px-4 py-2.5 text-xs font-semibold text-[var(--ak-emerald-deep)] disabled:opacity-60"
          >
            <ImageIcon className="size-3.5" />
            Galerie
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onSelected}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onSelected}
          />
        </div>
      </div>

      {broken && photoUrl ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          L&apos;aperçu n&apos;a pas pu s&apos;afficher. Réessayez d&apos;envoyer
          la photo (Galerie).
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  )
}
