"use client"

import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { MemberCardActions } from "@/components/adhesion/member-card-actions"
import { ResendBadgeButton } from "@/components/adherents/resend-badge-button"
import { formatDate } from "@/lib/format"

export function MemberCardPanel({
  member,
  badgeSentAt,
  badgeEmailSentAt,
  hasEmail,
}: {
  member: {
    id: string
    prenoms: string
    nom: string
    celluleLocale: string
    zoneRegion?: string | null
    tel: string
    whatsapp: string | null
    memberNumber?: number | null
    photoUrl?: string | null
  }
  badgeSentAt: Date | null
  badgeEmailSentAt: Date | null
  hasEmail: boolean
}) {
  return (
    <SectionCard
      title="Carte membre"
      description="Envoi auto WhatsApp (et email si renseigné) après paiement. Accès versements : téléphone + 4 derniers caractères de l'ID."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge
          label={
            badgeSentAt
              ? `WhatsApp : ${formatDate(badgeSentAt)}`
              : "WhatsApp non envoyé"
          }
          variant={badgeSentAt ? "success" : "warning"}
        />
        <StatusBadge
          label={
            !hasEmail
              ? "Pas d'email"
              : badgeEmailSentAt
                ? `Email : ${formatDate(badgeEmailSentAt)}`
                : "Email non envoyé"
          }
          variant={
            !hasEmail ? "neutral" : badgeEmailSentAt ? "success" : "warning"
          }
        />
      </div>
      <ResendBadgeButton adherentId={member.id} />
      <div className="mt-6 border-t border-[#E6DCC0] pt-6">
        <MemberCardActions member={member} />
      </div>
    </SectionCard>
  )
}
