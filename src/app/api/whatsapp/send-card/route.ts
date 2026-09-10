import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { memberCardCaption } from "@/lib/member-badge"
import { renderMemberBadgePngBuffer } from "@/lib/member-badge-server"
import { buildValidationUrl } from "@/lib/adhesion-id"
import {
  buildMemberCardWaMeUrl,
  isWhatsAppCloudConfigured,
  phonesMatch,
  sendWhatsAppCloudMedia,
} from "@/lib/whatsapp"
import { sendCardSchema } from "@/features/whatsapp/schema"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limitedIp = rateLimit(`whatsapp-send-card:${ip}`, 10, 15 * 60 * 1000)
  if (!limitedIp.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limitedIp.retryAfter) } }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = sendCardSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Données invalides"
    return NextResponse.json({ error: message }, { status: 400 })
  }
  const { adherentId, tel } = parsed.data

  const limitedAdherent = rateLimit(
    `whatsapp-send-card-adherent:${adherentId}`,
    5,
    15 * 60 * 1000
  )
  if (!limitedAdherent.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limitedAdherent.retryAfter) } }
    )
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
      memberNumber: true,
      photoUrl: true,
    },
  })
  if (!adherent) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 })
  }

  const session = await getSession()
  if (!session) {
    if (!tel) {
      return NextResponse.json(
        { error: "Téléphone requis pour l’envoi" },
        { status: 400 }
      )
    }
    const matches =
      phonesMatch(tel, adherent.tel) ||
      (adherent.whatsapp ? phonesMatch(tel, adherent.whatsapp) : false)
    if (!matches) {
      return NextResponse.json(
        { error: "Téléphone ne correspond pas à la fiche" },
        { status: 403 }
      )
    }
  }

  const phone = adherent.whatsapp || adherent.tel
  const validationUrl = buildValidationUrl({ id: adherent.id })
  const badgeData = {
    id: adherent.id,
    prenoms: adherent.prenoms,
    nom: adherent.nom,
    celluleLocale: adherent.celluleLocale,
    tel: adherent.tel,
    whatsapp: adherent.whatsapp,
    validationUrl,
    memberNumber: adherent.memberNumber,
    photoUrl: adherent.photoUrl,
  }
  const caption = memberCardCaption(badgeData)
  const waMe = buildMemberCardWaMeUrl(badgeData)

  if (isWhatsAppCloudConfigured()) {
    // La carte est toujours régénérée par le serveur à partir des vraies
    // données du membre — jamais depuis une image envoyée par le visiteur
    // (voir P1-2 de l'audit sécurité : ne jamais faire confiance à un
    // contenu binaire fourni par l'appelant pour un envoi WhatsApp officiel).
    const png = await renderMemberBadgePngBuffer(badgeData)
    const result = await sendWhatsAppCloudMedia({
      to: phone,
      caption,
      imageBase64: png.toString("base64"),
    })
    if (result.ok) {
      return NextResponse.json({
        ok: true,
        mode: "cloud",
        messageId: result.messageId,
      })
    }
    return NextResponse.json({
      ok: false,
      fallback: "wa_me",
      url: waMe,
      error: result.error,
    })
  }

  return NextResponse.json({
    ok: false,
    fallback: "wa_me",
    url: waMe,
  })
}
