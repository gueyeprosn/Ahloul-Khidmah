export type MemberBadgeData = {
  id: string
  prenoms: string
  nom: string
  celluleLocale?: string | null
  /** Repli affiché sur la carte si la cellule n'est pas renseignée. */
  zoneRegion?: string | null
  tel?: string | null
  whatsapp?: string | null
  validationUrl: string
  memberNumber?: number | null
  photoUrl?: string | null
}

/** Dimensions natives du modèle officiel `carte-membre-model.png`. */
export const BADGE_WIDTH = 1024
export const BADGE_HEIGHT = 1536

export function memberBadgePhone(data: Pick<MemberBadgeData, "whatsapp" | "tel">) {
  return (data.whatsapp || data.tel || "").trim()
}

export function memberCardCaption(data: Pick<MemberBadgeData, "id" | "prenoms" | "nom" | "validationUrl">) {
  const name = `${data.prenoms} ${data.nom}`.trim()
  // Import différé évité : lignes d'accès inline pour rester synchrone côté client.
  const suffix = data.id.slice(-4).toUpperCase()
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          "https://www.ahloulkhidmah.org")
  return [
    "Assalamu alaykum,",
    "",
    "Voici votre carte membre AHLOUL KHIDMAH.",
    `N° membre : ${data.id}`,
    `Nom : ${name}`,
    `Validation : ${data.validationUrl}`,
    "",
    `Votre espace membre : ${origin}/mon-espace`,
    `Accès : votre téléphone + les 4 derniers caractères de votre N° (${suffix})`,
    "",
    "Servir Serigne Touba avec Foi, Discipline, Savoir et Excellence.",
  ].join("\n")
}
