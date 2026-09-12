/**
 * Calcul d’un crop « cover » pour le disque photo du badge.
 * - Ratio conservé (pas d’étirement)
 * - Carré source centré ; portraits : biais haut (visage)
 * - `lift` > 0 remonte l’image dans le cercle (visage plus haut)
 */
export function circularPhotoCover(
  imgW: number,
  imgH: number,
  cx: number,
  cy: number,
  size: number,
  zoom = 1.08,
  lift = 0
) {
  const side = Math.min(imgW, imgH)
  const sx = (imgW - side) / 2
  // Portraits : un peu au-dessus du centre géométrique pour garder le visage
  const sy =
    imgH > imgW * 1.05
      ? Math.max(0, (imgH - side) * 0.18)
      : (imgH - side) / 2

  const draw = size * zoom
  const dx = cx - draw / 2
  const dy = cy - draw / 2 - lift

  return { sx, sy, side, dx, dy, draw }
}
