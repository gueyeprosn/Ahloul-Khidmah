import { describe, expect, it } from "vitest"
import { clampCrop, coverScale, cropSourceRect, zoomAround } from "@/lib/photo-crop"

describe("recadrage photo", () => {
  const W = 4000
  const H = 3000
  const VP = 300

  it("par défaut : carré centré sur le plus petit côté", () => {
    const r = cropSourceRect({ zoom: 1, tx: 0, ty: 0 }, W, H, VP)
    expect(r.size).toBeCloseTo(3000)
    expect(r.sy).toBeCloseTo(0)
    expect(r.sx).toBeCloseTo(500)
  })

  it("zoom ×2 : la zone visible est deux fois plus petite", () => {
    const r = cropSourceRect({ zoom: 2, tx: 0, ty: 0 }, W, H, VP)
    expect(r.size).toBeCloseTo(1500)
    expect(r.sx).toBeCloseTo(1250)
    expect(r.sy).toBeCloseTo(750)
  })

  it("le déplacement est borné : jamais de bord vide dans le cadre", () => {
    const s = clampCrop({ zoom: 1, tx: 9999, ty: 9999 }, W, H, VP)
    const r = cropSourceRect(s, W, H, VP)
    expect(r.sx).toBeGreaterThanOrEqual(-0.001)
    expect(r.sy).toBeGreaterThanOrEqual(-0.001)
    expect(r.sx + r.size).toBeLessThanOrEqual(W + 0.001)
    expect(r.sy + r.size).toBeLessThanOrEqual(H + 0.001)
    // image au zoom minimal : seul le côté long peut bouger
    expect(s.ty).toBe(0)
  })

  it("zoom borné entre ×1 et ×4", () => {
    expect(clampCrop({ zoom: 0.2, tx: 0, ty: 0 }, W, H, VP).zoom).toBe(1)
    expect(clampCrop({ zoom: 99, tx: 0, ty: 0 }, W, H, VP).zoom).toBe(4)
  })

  it("zoom autour d'un point : ce point de l'image reste sous le doigt", () => {
    const start = { zoom: 1, tx: 0, ty: 0 }
    const px = 220
    const py = 100
    const before = cropSourceRect(start, W, H, VP)
    const imgXBefore = before.sx + (px / VP) * before.size
    const imgYBefore = before.sy + (py / VP) * before.size
    const next = zoomAround(start, 2.5, px, py, W, H, VP)
    const after = cropSourceRect(next, W, H, VP)
    expect(after.sx + (px / VP) * after.size).toBeCloseTo(imgXBefore, 0)
    expect(after.sy + (py / VP) * after.size).toBeCloseTo(imgYBefore, 0)
  })

  it("image portrait : cover sur la largeur", () => {
    expect(coverScale(1000, 2000, 300)).toBeCloseTo(0.3)
    const r = cropSourceRect({ zoom: 1, tx: 0, ty: 0 }, 1000, 2000, 300)
    expect(r.size).toBeCloseTo(1000)
    expect(r.sy).toBeCloseTo(500)
  })
})
