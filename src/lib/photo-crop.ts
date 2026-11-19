/**
 * Mathématiques du recadrage de photo (fenêtre carrée, déplacement + zoom).
 * Pur et sans DOM : testable, utilisé par PhotoCropDialog.
 *
 * Repère : la fenêtre (viewport) est un carré de `vp` px. L'image est affichée
 * à l'échelle `cover × zoom` (cover = plus petite échelle qui remplit la
 * fenêtre) ; (tx, ty) décale son centre par rapport au centre de la fenêtre.
 */

export type CropState = { zoom: number; tx: number; ty: number }

export const MIN_ZOOM = 1
export const MAX_ZOOM = 4

/** Échelle minimale pour que l'image remplisse entièrement la fenêtre. */
export function coverScale(imgW: number, imgH: number, vp: number) {
  return vp / Math.min(imgW, imgH)
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** Garde l'image couvrant la fenêtre : jamais de bord vide dans le cadre. */
export function clampCrop(
  state: CropState,
  imgW: number,
  imgH: number,
  vp: number
): CropState {
  const zoom = clamp(state.zoom, MIN_ZOOM, MAX_ZOOM)
  const scale = coverScale(imgW, imgH, vp) * zoom
  const maxX = Math.max(0, (imgW * scale - vp) / 2)
  const maxY = Math.max(0, (imgH * scale - vp) / 2)
  return { zoom, tx: clamp(state.tx, -maxX, maxX), ty: clamp(state.ty, -maxY, maxY) }
}

/** Zone de l'image d'origine (en pixels naturels) visible dans la fenêtre. */
export function cropSourceRect(
  state: CropState,
  imgW: number,
  imgH: number,
  vp: number
) {
  const s = clampCrop(state, imgW, imgH, vp)
  const scale = coverScale(imgW, imgH, vp) * s.zoom
  const left = vp / 2 - (imgW * scale) / 2 + s.tx
  const top = vp / 2 - (imgH * scale) / 2 + s.ty
  const size = vp / scale
  return { sx: -left / scale, sy: -top / scale, size }
}

/** Zoom qui garde fixe le point (px, py) de la fenêtre (molette, pincement). */
export function zoomAround(
  state: CropState,
  nextZoom: number,
  px: number,
  py: number,
  imgW: number,
  imgH: number,
  vp: number
): CropState {
  const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
  const ratio = z / state.zoom
  const cx = px - vp / 2
  const cy = py - vp / 2
  return clampCrop(
    { zoom: z, tx: cx - (cx - state.tx) * ratio, ty: cy - (cy - state.ty) * ratio },
    imgW,
    imgH,
    vp
  )
}
