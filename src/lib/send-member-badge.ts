import { buildValidationUrl } from "@/lib/adhesion-id"
import { prisma } from "@/lib/db"
import { memberCardCaption } from "@/lib/member-badge"
import { renderMemberBadgePngBuffer } from "@/lib/member-badge-server"
import {
  isWhatsAppCloudConfigured,
  sendWhatsAppCloudMedia,
} from "@/lib/whatsapp"

export type SendBadgeResult =
  | { ok: true; messageId?: string }
  | { ok: false; reason: "no_cloud" | "not_found" | "no_phone" | "already_sent" | "send_failed"; error?: string }

/** Envoie le badge membre via WhatsApp Cloud (arrière-plan, sans action utilisateur). */
export async function sendAdherentBadgeWhatsApp(
  adherentId: string,
  opts?: { force?: boolean }
): Promise<SendBadgeResult> {
  if (!isWhatsAppCloudConfigured()) {
    return { ok: false, reason: "no_cloud" }
  }

  const adherent = await prisma.adherent.findUnique({
    where: { id: adherentId },
    select: {
      id: true,
      nom: true,
      prenoms: true,
      tel: true,
      whatsapp: true,
      celluleLocale: true,
      zoneRegion: true,
      badgeSentAt: true,
      memberNumber: true,
      photoUrl: true,
      pinHash: true,
    },
  })

  if (!adherent) {
    return { ok: false, reason: "not_found" }
  }

  if (adherent.badgeSentAt && !opts?.force) {
    return { ok: false, reason: "already_sent" }
  }

  const phone = (adherent.whatsapp || adherent.tel || "").trim()
  if (!phone) {
    return { ok: false, reason: "no_phone" }
  }

  const validationUrl = buildValidationUrl({ id: adherent.id })

  const badgeData = {
    id: adherent.id,
    prenoms: adherent.prenoms,
    nom: adherent.nom,
    celluleLocale: adherent.celluleLocale,
    zoneRegion: adherent.zoneRegion,
    tel: adherent.tel,
    whatsapp: adherent.whatsapp,
    validationUrl,
    memberNumber: adherent.memberNumber,
    photoUrl: adherent.photoUrl,
    hasPin: Boolean(adherent.pinHash),
  }

  try {
    const png = await renderMemberBadgePngBuffer(badgeData)
    const result = await sendWhatsAppCloudMedia({
      to: phone,
      caption: memberCardCaption(badgeData),
      imageBase64: png.toString("base64"),
    })

    if (!result.ok) {
      console.error("sendAdherentBadgeWhatsApp:", adherentId, result.error)
      return { ok: false, reason: "send_failed", error: result.error }
    }

    await prisma.adherent.update({
      where: { id: adherentId },
      data: { badgeSentAt: new Date() },
    })

    return { ok: true, messageId: result.messageId }
  } catch (e) {
    console.error("sendAdherentBadgeWhatsApp error", adherentId, e)
    return {
      ok: false,
      reason: "send_failed",
      error: e instanceof Error ? e.message : "Erreur inconnue",
    }
  }
}

/** Lance l'envoi sans bloquer la requête HTTP. */
export function queueAdherentBadgeWhatsApp(adherentId: string) {
  void sendAdherentBadgeWhatsApp(adherentId).catch((e) => {
    console.error("queueAdherentBadgeWhatsApp", adherentId, e)
  })
}

/** WhatsApp + email (si renseigné), sans bloquer la requête HTTP. */
export function queueAdherentBadgeNotify(adherentId: string) {
  queueAdherentBadgeWhatsApp(adherentId)
  void import("@/lib/send-member-email").then(({ queueAdherentBadgeEmail }) => {
    queueAdherentBadgeEmail(adherentId)
  })
}
