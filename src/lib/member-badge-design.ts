/**
 * Layout du modèle officiel `public/brand/carte-membre-model.png` (1024×1536).
 * MASTER TEMPLATE = source de vérité. Ne pas déplacer sans revalidation visuelle.
 */
export const BADGE_COLORS = {
  emeraldDeep: "#073B2A",
  emerald: "#0B4A34",
  gold: "#C9A24C",
  goldLight: "#E8CE83",
  /** Crème échantillonnée sur le PNG modèle (zone noms). */
  ivory: "#F2E7D6",
  ink: "#073B2A",
  white: "#FFFFFF",
} as const

export const BADGE_FONT_FAMILY = "Playfair Display"

/**
 * Zones dynamiques uniquement — tout le reste est dans le PNG.
 * Photo : disque intérieur (gris ~r121, filet or ensuite).
 * Noms : entre filets or y≈875 et y≈996.
 * ID : après le « | » (pipe ~x472) dans la pastille.
 * QR : moitié droite du cadre vérification (ne pas dépasser x≈800).
 */
export const TEMPLATE_LAYOUT = {
  /** Légèrement remonté pour caler le visage dans le disque or du modèle. */
  photo: { cx: 508, cy: 675, size: 242 },
  cardLabel: { y: 866, coverY: 820, coverH: 52 },
  prenom: { y: 922 },
  nom: { y: 972 },
  memberId: { x: 488, cy: 1054, maxWidth: 265 },
  cellule: {
    cy: 1118,
    coverX: 438,
    coverY: 1098,
    coverW: 200,
    coverH: 34,
    textMinX: 438,
  },
  qr: { x: 625, y: 1198, size: 118 },
} as const

export const BADGE_TYPE = {
  cardLabel: `600 22px '${BADGE_FONT_FAMILY}'`,
  prenom: `500 28px '${BADGE_FONT_FAMILY}'`,
  nom: `700 44px '${BADGE_FONT_FAMILY}'`,
  memberId: "700 18px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  cellule: `600 15px '${BADGE_FONT_FAMILY}'`,
} as const

/** Zoom cover léger dans le cercle. */
export const PHOTO_COVER_ZOOM = 1.08
/**
 * Remonte la photo dans le disque (px). Positif = visage plus haut
 * dans le cercle réservé.
 */
export const PHOTO_COVER_LIFT = 18
