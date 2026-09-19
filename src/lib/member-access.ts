/** 4 derniers caractères de l'ID badge (ex. AK-20260903-1F5X2Z → 5X2Z). */
export function memberIdSuffix(id: string, length = 4) {
  const clean = id.trim().toUpperCase()
  if (clean.length < length) return clean
  return clean.slice(-length)
}

export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.ahloulkhidmah.org"
  )
}

export function buildMesVersementsUrl() {
  return `${siteOrigin()}/mon-espace`
}

export function buildMonEspaceUrl() {
  return `${siteOrigin()}/mon-espace`
}

/**
 * Lignes d'accès à inclure dans WhatsApp / email. Une fois un PIN personnel
 * défini, le suffixe d'ID n'est plus une méthode de connexion valide (voir
 * findAdherentByTelAndCode) — le message ne doit plus l'indiquer comme accès,
 * sous peine d'égarer le membre avec une information désormais fausse.
 */
export function memberAccessLines(id: string, hasPin = false) {
  const url = buildMonEspaceUrl()
  if (hasPin) {
    return [
      `Votre espace membre : ${url}`,
      "Accès : votre téléphone + le code PIN que vous avez défini.",
    ]
  }
  const suffix = memberIdSuffix(id)
  return [
    `Votre espace membre : ${url}`,
    `Accès : votre téléphone + les 4 derniers caractères de votre N° (${suffix})`,
  ]
}
