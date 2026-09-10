import type { MemberBadgeData } from "@/lib/member-badge"
import { BADGE_WIDTH } from "@/lib/member-badge"
import {
  BADGE_COLORS as C,
  BADGE_TYPE as T,
  TEMPLATE_LAYOUT as L,
} from "@/lib/member-badge-design"

/**
 * Contexte canvas minimal partagé serveur (@napi-rs/canvas) / client (navigateur).
 */
export interface BadgeCtx {
  fillStyle: string | CanvasGradient | CanvasPattern
  strokeStyle: string | CanvasGradient | CanvasPattern
  lineWidth: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  measureText(text: string): TextMetrics
  fillText(text: string, x: number, y: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  beginPath(): void
  arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean): void
  closePath(): void
  fill(): void
  clip(): void
  save(): void
  restore(): void
}

export type BadgePaintHooks = {
  /** Dessine le PNG modèle en fond (1024×1536). */
  drawTemplate(): Promise<void>
  /** Photo circulaire ; false → initiales. */
  drawPhoto(cx: number, cy: number, size: number): Promise<boolean>
  /** QR dans le cadre vérification. */
  drawQr(x: number, y: number, size: number): Promise<void>
}

function wrapText(ctx: BadgeCtx, text: string, maxWidth: number, maxLines = 2) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, maxLines)
}

function fitText(ctx: BadgeCtx, text: string, maxWidth: number, baseFont: string) {
  ctx.font = baseFont
  if (ctx.measureText(text).width <= maxWidth) return baseFont
  const match = baseFont.match(/^(\d+\s+)?(\d+)px\b/) || baseFont.match(/(\d+)px/)
  if (!match) return baseFont
  let size = Number(match[match.length - 1])
  while (size > 12) {
    size -= 1
    const next = baseFont.replace(/(\d+)px/, `${size}px`)
    ctx.font = next
    if (ctx.measureText(text).width <= maxWidth) return next
  }
  return baseFont.replace(/(\d+)px/, "12px")
}

function memberInitials(prenoms: string, nom: string) {
  const a = prenoms.trim().charAt(0)
  const b = nom.trim().charAt(0)
  return `${a}${b}`.toUpperCase() || "AK"
}

function drawInitialsPlaceholder(
  ctx: BadgeCtx,
  data: MemberBadgeData,
  cx: number,
  cy: number,
  size: number
) {
  const r = size / 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = "#E8F0EA"
  ctx.fill()
  ctx.fillStyle = C.emeraldDeep
  ctx.font = `700 ${Math.round(size * 0.28)}px '${"Playfair Display"}'`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(memberInitials(data.prenoms, data.nom), cx, cy + 2)
  ctx.textBaseline = "alphabetic"
}

/** Peint un fond ivoire sous la photo pour masquer le gris du modèle. */
export function clearPhotoSlot(
  ctx: BadgeCtx,
  cx: number,
  cy: number,
  size: number
) {
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = C.ivory
  ctx.fill()
}

function resolveCelluleLabel(data: MemberBadgeData): string | null {
  const cell = (data.celluleLocale || "").trim()
  if (cell && cell !== "À préciser") return cell.toUpperCase()
  return null
}

/**
 * Remplit le MASTER TEMPLATE : fond PNG fixe + zones dynamiques uniquement.
 */
export async function paintMemberBadge(
  ctx: BadgeCtx,
  data: MemberBadgeData,
  hooks: BadgePaintHooks
) {
  await hooks.drawTemplate()

  const centerX = BADGE_WIDTH / 2

  // Photo
  clearPhotoSlot(ctx, L.photo.cx, L.photo.cy, L.photo.size)
  const photoDrawn = await hooks.drawPhoto(L.photo.cx, L.photo.cy, L.photo.size)
  if (!photoDrawn) {
    drawInitialsPlaceholder(ctx, data, L.photo.cx, L.photo.cy, L.photo.size)
  }

  // CARTE MEMBRE • N° …
  ctx.fillStyle = C.ivory
  ctx.fillRect(180, L.cardLabel.coverY, BADGE_WIDTH - 360, L.cardLabel.coverH)
  const num =
    typeof data.memberNumber === "number" ? String(data.memberNumber) : ""
  const cardLabel = num ? `CARTE MEMBRE  •  N° ${num}` : "CARTE MEMBRE"
  ctx.fillStyle = C.emeraldDeep
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.font = T.cardLabel
  ctx.fillText(cardLabel, centerX, L.cardLabel.y)

  // Prénom(s) + NOM — zone entre les deux filets or
  const prenoms = data.prenoms.trim()
  const nom = data.nom.trim().toUpperCase()
  const nameMax = BADGE_WIDTH - 160

  ctx.fillStyle = C.ink
  ctx.font = fitText(ctx, prenoms, nameMax, T.prenom)
  let nameY: number = L.prenom.y
  for (const line of wrapText(ctx, prenoms, nameMax, 2)) {
    ctx.fillText(line, centerX, nameY)
    nameY += 32
  }

  ctx.fillStyle = C.emeraldDeep
  ctx.font = fitText(ctx, nom, nameMax, T.nom)
  nameY = Math.max(nameY + 10, L.nom.y)
  for (const line of wrapText(ctx, nom, nameMax, 2)) {
    ctx.fillText(line, centerX, nameY)
    nameY += 48
  }

  // MEMBER ID — après le « | » du modèle
  const idFont = fitText(ctx, data.id, L.memberId.maxWidth, T.memberId)
  ctx.font = idFont
  ctx.fillStyle = C.goldLight
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(data.id, L.memberId.x, L.memberId.cy)
  ctx.textBaseline = "alphabetic"

  // Cellule — si absente / « À préciser », on laisse le placeholder du template
  const cellText = resolveCelluleLabel(data)
  if (cellText) {
    ctx.font = fitText(ctx, cellText, 360, T.cellule)
    const cellW = Math.max(
      L.cellule.coverW,
      Math.ceil(ctx.measureText(cellText).width) + 16
    )
    ctx.fillStyle = C.ivory
    ctx.fillRect(L.cellule.coverX, L.cellule.coverY, cellW, L.cellule.coverH)
    ctx.fillStyle = C.emeraldDeep
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(cellText, L.cellule.textMinX, L.cellule.cy)
    ctx.textBaseline = "alphabetic"
  }

  ctx.textAlign = "center"

  // QR
  await hooks.drawQr(L.qr.x, L.qr.y, L.qr.size)
}
