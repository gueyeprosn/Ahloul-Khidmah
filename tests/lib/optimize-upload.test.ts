import { describe, it, expect } from "vitest"
import sharp from "sharp"
import { optimizeUpload } from "@/lib/optimize-upload"

async function noisy(w: number, h: number) {
  const raw = Buffer.alloc(w * h * 3)
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 7919 + (i >> 3)) & 255
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 100 }).toBuffer()
}

describe("optimizeUpload", () => {
  it("réduit une grande image JPEG (côté max 1600) et la rend plus légère", async () => {
    const big = await noisy(3000, 2000)
    const out = await optimizeUpload(big, "image/jpeg")
    const meta = await sharp(out).metadata()
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(1600)
    expect(out.length).toBeLessThan(big.length)
    expect(meta.format).toBe("jpeg")
  })
  it("laisse un GIF intact et un fichier invalide inchangé", async () => {
    const gif = Buffer.from("GIF89a")
    expect(await optimizeUpload(gif, "image/gif")).toBe(gif)
    const junk = Buffer.from("pas une image")
    expect(await optimizeUpload(junk, "image/jpeg")).toBe(junk)
  })
})
