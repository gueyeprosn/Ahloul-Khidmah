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

/** Lignes d'accès à inclure dans WhatsApp / email. */
export function memberAccessLines(id: string) {
  const suffix = memberIdSuffix(id)
  const url = buildMonEspaceUrl()
  return [
    `Votre espace membre : ${url}`,
    `Accès : votre téléphone + les 4 derniers caractères de votre N° (${suffix})`,
  ]
}
