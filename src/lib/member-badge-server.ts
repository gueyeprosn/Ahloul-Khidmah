import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas"
import path from "node:path"
import QRCode from "qrcode"
import { BADGE_HEIGHT, BADGE_WIDTH, type MemberBadgeData } from "@/lib/member-badge"
import {
  BADGE_FONT_FAMILY,
  PHOTO_COVER_ZOOM,
} from "@/lib/member-badge-design"
import { circularPhotoCover } from "@/lib/member-badge-photo"
import { paintMemberBadge } from "@/lib/member-badge-draw"

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "brand",
  "carte-membre-model.png"
)
const FONT_DIR = path.join(process.cwd(), "public", "brand", "fonts")

GlobalFonts.registerFromPath(
  path.join(FONT_DIR, "PlayfairDisplay.ttf"),
  BADGE_FONT_FAMILY
)
GlobalFonts.registerFromPath(
  path.join(FONT_DIR, "PlayfairDisplay-Italic.ttf"),
  BADGE_FONT_FAMILY
)

/** Génère le badge PNG côté serveur (buffer) — WhatsApp Cloud, email, aperçu admin. */
export async function renderMemberBadgePngBuffer(
  data: MemberBadgeData
): Promise<Buffer> {
  const qrDataUrl = await QRCode.toDataURL(data.validationUrl, {
    width: 460,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#073B2A", light: "#FFFFFF" },
  })

  const canvas = createCanvas(BADGE_WIDTH, BADGE_HEIGHT)
  const ctx = canvas.getContext("2d")
  const template = await loadImage(TEMPLATE_PATH)

  await paintMemberBadge(ctx, data, {
    async drawTemplate() {
      ctx.drawImage(template, 0, 0, BADGE_WIDTH, BADGE_HEIGHT)
    },
    async drawPhoto(cx, cy, size) {
      if (!data.photoUrl) return false
      try {
        const photoPath = path.join(
          process.cwd(),
          "public",
          data.photoUrl.replace(/^\//, "")
        )
        const photo = await loadImage(photoPath)
        const r = size / 2
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = "#F2E7D6"
        ctx.fill()
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.clip()
        const { sx, sy, side, dx, dy, draw } = circularPhotoCover(
          photo.width,
          photo.height,
          cx,
          cy,
          size,
          PHOTO_COVER_ZOOM
        )
        ctx.drawImage(photo, sx, sy, side, side, dx, dy, draw, draw)
        ctx.restore()
        return true
      } catch {
        return false
      }
    },
    async drawQr(x, y, size) {
      const qrImg = await loadImage(qrDataUrl)
      ctx.drawImage(qrImg, x, y, size, size)
    },
  })

  return canvas.toBuffer("image/png")
}
