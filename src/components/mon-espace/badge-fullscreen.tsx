"use client"

import { X } from "lucide-react"
import { MemberCardActions } from "@/components/adhesion/member-card-actions"
import { MemberPhotoUpload } from "@/components/mon-espace/member-photo-upload"

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
  onPhotoSelected: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClose: () => void
}

/** Vue plein écran du badge, ouverte depuis le menu ("Voir mon badge").
 * Réutilise MemberCardActions tel quel (design/dimensions figés — voir
 * README § 10) : seule la mise en page autour change. */
export function BadgeFullscreen({
  member,
  photoUploading,
  photoError,
  onPhotoSelected,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--ak-ivory)]">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--ak-emerald-deep)]">
            Mon badge
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-2 text-[var(--ak-ink-soft)] hover:bg-black/5"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 rounded-2xl border border-[var(--ak-gold)]/45 bg-white p-5 shadow-[0_12px_36px_rgba(11,58,37,0.08)]">
          <MemberCardActions member={member} variant="share" />
        </div>

        <div className="mt-5">
          <MemberPhotoUpload
            photoUrl={member.photoUrl}
            name={`${member.prenoms} ${member.nom}`.trim()}
            uploading={photoUploading}
            error={photoError}
            onSelected={onPhotoSelected}
            compact
          />
        </div>
      </div>
    </div>
  )
}
