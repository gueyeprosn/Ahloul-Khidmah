/**
 * Calcul d’un crop « cover » centré pour un disque photo (badge / aperçu).
 * - Ratio conservé (pas d’étirement)
 * - Carré source centré ; portraits : léger biais haut (visage)
 * - Destination centrée dans le cercle (pas de décalage vertical)
 */
export function circularPhotoCover(
  imgW: number,
  imgH: number,
  cx: number,
  cy: number,
  size: number,
  zoom = 1.05
) {
  const side = Math.min(imgW, imgH)
  const sx = (imgW - side) / 2
  // Portraits : un peu au-dessus du centre géométrique pour garder le visage
  const sy =
    imgH > imgW * 1.05
      ? Math.max(0, (imgH - side) * 0.22)
      : (imgH - side) / 2

  const draw = size * zoom
  const dx = cx - draw / 2
  const dy = cy - draw / 2

  return { sx, sy, side, dx, dy, draw }
}
