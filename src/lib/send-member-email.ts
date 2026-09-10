import { buildValidationUrl } from "@/lib/adhesion-id"
import { prisma } from "@/lib/db"
import { isMailConfigured, sendMail } from "@/lib/mail"
import {
  buildMesVersementsUrl,
  memberAccessLines,
  memberIdSuffix,
} from "@/lib/member-access"
import { renderMemberBadgePngBuffer } from "@/lib/member-badge-server"

export type SendBadgeEmailResult =
  | { ok: true; messageId?: string }
  | {
      ok: false
      reason:
        | "no_mail"
        | "not_found"
        | "no_email"
        | "already_sent"
        | "send_failed"
      error?: string
    }

/** Envoie le badge + consignes d'accès par email si l'adresse est renseignée. */
export async function sendAdherentBadgeEmail(
  adherentId: string,
  opts?: { force?: boolean }
): Promise<SendBadgeEmailResult> {
  if (!isMailConfigured()) {
    return { ok: false, reason: "no_mail" }
  }

  const adherent = await prisma.adherent.findUnique({
    where: { id: adherentId },
    select: {
      id: true,
      nom: true,
      prenoms: true,
      tel: true,
      whatsapp: true,
      email: true,
      celluleLocale: true,
      zoneRegion: true,
      badgeEmailSentAt: true,
      memberNumber: true,
      photoUrl: true,
    },
  })

  if (!adherent) {
    return { ok: false, reason: "not_found" }
  }

  const email = adherent.email?.trim()
  if (!email) {
    return { ok: false, reason: "no_email" }
  }

  if (adherent.badgeEmailSentAt && !opts?.force) {
    return { ok: false, reason: "already_sent" }
  }

  const validationUrl = buildValidationUrl({ id: adherent.id })
  const access = memberAccessLines(adherent.id)
  const portalUrl = buildMesVersementsUrl()
  const suffix = memberIdSuffix(adherent.id)
  const name = `${adherent.prenoms} ${adherent.nom}`.trim()

  const text = [
    "Assalamu alaykum,",
    "",
    "Voici votre carte membre AHLOUL KHIDMAH.",
    `N° membre : ${adherent.id}`,
    `Nom : ${name}`,
    `Validation : ${validationUrl}`,
    "",
    ...access,
    "",
    "Servir Serigne Touba avec Foi, Discipline, Savoir et Excellence.",
  ].join("\n")

  const html = `
    <div style="font-family:Georgia,serif;color:#0f2e1f;line-height:1.5;max-width:560px">
      <p>Assalamu alaykum,</p>
      <p>Voici votre carte membre <strong>AHLOUL KHIDMAH</strong>.</p>
      <p>
        <strong>N° membre :</strong> ${adherent.id}<br/>
        <strong>Nom :</strong> ${name}
      </p>
      <p>
        <a href="${portalUrl}"
           style="display:inline-block;background:#164A2E;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">
          Accéder à mon espace
        </a>
      </p>
      <p style="font-size:14px;color:#3d5a4a">
        Accès à votre espace : votre téléphone + les 4 derniers caractères de votre N°
        (<strong>${suffix}</strong>).
      </p>
      <p style="font-size:13px">
        <a href="${validationUrl}">Lien de validation du badge</a>
      </p>
      <p style="font-size:13px;color:#5a6b60">
        Servir Serigne Touba avec Foi, Discipline, Savoir et Excellence.
      </p>
    </div>
  `.trim()

  try {
    const png = await renderMemberBadgePngBuffer({
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
    })

    const result = await sendMail({
      to: email,
      subject: `Votre carte membre AHLOUL KHIDMAH — ${adherent.id}`,
      text,
      html,
      attachments: [
        {
          filename: `carte-membre-${adherent.id}.png`,
          content: png,
          contentType: "image/png",
        },
      ],
    })

    if (!result.ok) {
      return { ok: false, reason: "send_failed", error: result.error }
    }

    await prisma.adherent.update({
      where: { id: adherentId },
      data: { badgeEmailSentAt: new Date() },
    })

    return { ok: true, messageId: result.messageId }
  } catch (e) {
    console.error("sendAdherentBadgeEmail error", adherentId, e)
    return {
      ok: false,
      reason: "send_failed",
      error: e instanceof Error ? e.message : "Erreur inconnue",
    }
  }
}

export function queueAdherentBadgeEmail(adherentId: string, force = false) {
  void sendAdherentBadgeEmail(adherentId, { force }).catch((e) => {
    console.error("queueAdherentBadgeEmail", adherentId, e)
  })
}
