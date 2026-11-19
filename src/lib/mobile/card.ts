import { createHash } from "node:crypto"
import { stat } from "node:fs/promises"
import path from "node:path"
import { createCanvas, loadImage } from "@napi-rs/canvas"
import { buildValidationUrl } from "@/lib/adhesion-id"
import { prisma } from "@/lib/db"
import type { MemberBadgeData } from "@/lib/member-badge"
import { renderMemberBadgePngBuffer } from "@/lib/member-badge-server"

/**
 * À incrémenter quand le DESIGN de la carte change (modèle, polices,
 * disposition) : invalide les ETag, donc les caches des applications.
 */
export const CARD_DESIGN_VERSION = "1"

export type CardSize = "display" | "full"

/**
 * - `full` : le PNG 1024×1536 d'origine (partage, impression).
 * - `display` : WebP 680×1020, qualité 90, ≈ 80 Ko au lieu de ≈ 900 Ko en PNG.
 *   Mesuré : le QR code reste décodable (comme en PNG). Le JPEG et les
 *   largeurs de 560 px ou moins ont rendu le QR illisible : ne pas les utiliser.
 */
export const CARD_FORMATS: Record<CardSize, { width: number; height: number; mime: string }> = {
  full: { width: 1024, height: 1536, mime: "image/png" },
  display: { width: 680, height: 1020, mime: "image/webp" },
}

export type CardSource = { data: MemberBadgeData; status: string }

/** Données de la carte du membre : exactement celles de l'envoi WhatsApp. */
export async function loadCardSource(adherentId: string): Promise<CardSource | null> {
  const a = await prisma.adherent.findUnique({
    where: { id: adherentId },
    select: {
      id: true, nom: true, prenoms: true, tel: true, whatsapp: true,
      celluleLocale: true, zoneRegion: true, memberNumber: true,
      photoUrl: true, pinHash: true, status: true,
    },
  })
  if (!a) return null
  return {
    status: a.status,
    data: {
      id: a.id,
      prenoms: a.prenoms,
      nom: a.nom,
      celluleLocale: a.celluleLocale,
      zoneRegion: a.zoneRegion,
      tel: a.tel,
      whatsapp: a.whatsapp,
      validationUrl: buildValidationUrl({ id: a.id }),
      memberNumber: a.memberNumber,
      photoUrl: a.photoUrl,
      hasPin: Boolean(a.pinHash),
    },
  }
}

/** Empreinte du contenu de la carte, sans la rendre (validation par ETag). */
export async function cardEtag(data: MemberBadgeData, size: CardSize): Promise<string> {
  let photoStamp = ""
  if (data.photoUrl) {
    try {
      const s = await stat(path.join(process.cwd(), "public", data.photoUrl.replace(/^\//, "")))
      photoStamp = `${s.size}:${Math.trunc(s.mtimeMs)}`
    } catch {
      photoStamp = "absente"
    }
  }
  const h = createHash("sha256")
    .update(
      JSON.stringify([
        CARD_DESIGN_VERSION, size, data.id, data.prenoms, data.nom,
        data.celluleLocale ?? "", data.zoneRegion ?? "", data.memberNumber ?? "",
        data.photoUrl ?? "", photoStamp, data.validationUrl,
      ])
    )
    .digest("hex")
    .slice(0, 32)
  return `"card-${h}"`
}

/** Rend la carte. Le rendu d'origine n'est jamais modifié : on le réduit seulement. */
export async function renderCard(data: MemberBadgeData, size: CardSize): Promise<Buffer> {
  const png = await renderMemberBadgePngBuffer(data)
  if (size === "full") return png
  const { width, height } = CARD_FORMATS.display
  const img = await loadImage(png)
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toBuffer("image/webp", 90)
}
