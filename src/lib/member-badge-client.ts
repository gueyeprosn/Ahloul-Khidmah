import QRCode from "qrcode"
import { BADGE_HEIGHT, BADGE_WIDTH, type MemberBadgeData } from "@/lib/member-badge"
import {
  BADGE_FONT_FAMILY,
  PHOTO_COVER_ZOOM,
} from "@/lib/member-badge-design"
import { circularPhotoCover } from "@/lib/member-badge-photo"
import { paintMemberBadge } from "@/lib/member-badge-draw"

const TEMPLATE_SRC = "/brand/carte-membre-model.png"
const FONT_REGULAR_SRC = "/brand/fonts/PlayfairDisplay.ttf"
const FONT_ITALIC_SRC = "/brand/fonts/PlayfairDisplay-Italic.ttf"

let fontsReady: Promise<void> | null = null

function ensureFontsLoaded() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      new FontFace(BADGE_FONT_FAMILY, `url(${FONT_REGULAR_SRC})`, {
        weight: "400 900",
        style: "normal",
      })
        .load()
        .then((f) => {
          document.fonts.add(f)
        }),
      new FontFace(BADGE_FONT_FAMILY, `url(${FONT_ITALIC_SRC})`, {
        weight: "400 900",
        style: "italic",
      })
        .load()
        .then((f) => {
          document.fonts.add(f)
        }),
    ])
      .then(() => undefined)
      .catch(() => undefined)
  }
  return fontsReady
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = src
  })
}

/** Génère le badge PNG (data URL) — modèle officiel rempli. */
export async function renderMemberBadgePng(data: MemberBadgeData): Promise<string> {
  await ensureFontsLoaded()

  const qrDataUrl = await QRCode.toDataURL(data.validationUrl, {
    width: 460,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#073B2A", light: "#FFFFFF" },
  })

  const canvas = document.createElement("canvas")
  canvas.width = BADGE_WIDTH
  canvas.height = BADGE_HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas indisponible")

  const template = await loadImage(TEMPLATE_SRC)

  await paintMemberBadge(ctx, data, {
    async drawTemplate() {
      ctx.drawImage(template, 0, 0, BADGE_WIDTH, BADGE_HEIGHT)
    },
    async drawPhoto(cx, cy, size) {
      if (!data.photoUrl) return false
      try {
        const photo = await loadImage(data.photoUrl)
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

  return canvas.toDataURL("image/png")
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  link.click()
}

export function dataUrlToBase64(dataUrl: string) {
  const i = dataUrl.indexOf(",")
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl
}
