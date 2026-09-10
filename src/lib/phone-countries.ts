export type PhoneCountry = {
  /** ISO 3166-1 alpha-2 */
  iso: string
  /** Indicatif sans + */
  dial: string
  label: string
}

/** Diaspora + Afrique de l’Ouest / Maghreb — liste courte et utile. */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { iso: "SN", dial: "221", label: "Sénégal" },
  { iso: "GM", dial: "220", label: "Gambie" },
  { iso: "MR", dial: "222", label: "Mauritanie" },
  { iso: "ML", dial: "223", label: "Mali" },
  { iso: "GN", dial: "224", label: "Guinée" },
  { iso: "CI", dial: "225", label: "Côte d'Ivoire" },
  { iso: "BF", dial: "226", label: "Burkina Faso" },
  { iso: "NE", dial: "227", label: "Niger" },
  { iso: "TG", dial: "228", label: "Togo" },
  { iso: "BJ", dial: "229", label: "Bénin" },
  { iso: "CV", dial: "238", label: "Cap-Vert" },
  { iso: "GW", dial: "245", label: "Guinée-Bissau" },
  { iso: "GH", dial: "233", label: "Ghana" },
  { iso: "NG", dial: "234", label: "Nigeria" },
  { iso: "CM", dial: "237", label: "Cameroun" },
  { iso: "GA", dial: "241", label: "Gabon" },
  { iso: "CG", dial: "242", label: "Congo" },
  { iso: "CD", dial: "243", label: "RDC" },
  { iso: "MA", dial: "212", label: "Maroc" },
  { iso: "DZ", dial: "213", label: "Algérie" },
  { iso: "TN", dial: "216", label: "Tunisie" },
  { iso: "EG", dial: "20", label: "Égypte" },
  { iso: "FR", dial: "33", label: "France" },
  { iso: "BE", dial: "32", label: "Belgique" },
  { iso: "CH", dial: "41", label: "Suisse" },
  { iso: "LU", dial: "352", label: "Luxembourg" },
  { iso: "IT", dial: "39", label: "Italie" },
  { iso: "ES", dial: "34", label: "Espagne" },
  { iso: "PT", dial: "351", label: "Portugal" },
  { iso: "DE", dial: "49", label: "Allemagne" },
  { iso: "NL", dial: "31", label: "Pays-Bas" },
  { iso: "GB", dial: "44", label: "Royaume-Uni" },
  { iso: "IE", dial: "353", label: "Irlande" },
  { iso: "CA", dial: "1", label: "Canada" },
  { iso: "US", dial: "1", label: "États-Unis" },
  { iso: "BR", dial: "55", label: "Brésil" },
  { iso: "AE", dial: "971", label: "Émirats arabes unis" },
  { iso: "SA", dial: "966", label: "Arabie saoudite" },
  { iso: "QA", dial: "974", label: "Qatar" },
  { iso: "KW", dial: "965", label: "Koweït" },
  { iso: "TR", dial: "90", label: "Turquie" },
  { iso: "ZA", dial: "27", label: "Afrique du Sud" },
] as const

export const DEFAULT_PHONE_ISO = "SN"

/** Emoji drapeau à partir du code ISO (ex. SN → 🇸🇳). */
export function flagEmoji(iso: string) {
  const code = iso.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️"
  return String.fromCodePoint(
    ...[...code].map((c) => 127397 + c.charCodeAt(0))
  )
}

const TZ_TO_ISO: Record<string, string> = {
  "Africa/Dakar": "SN",
  "Africa/Banjul": "GM",
  "Africa/Nouakchott": "MR",
  "Africa/Bamako": "ML",
  "Africa/Conakry": "GN",
  "Africa/Abidjan": "CI",
  "Africa/Ouagadougou": "BF",
  "Africa/Niamey": "NE",
  "Africa/Lome": "TG",
  "Africa/Porto-Novo": "BJ",
  "Atlantic/Cape_Verde": "CV",
  "Africa/Bissau": "GW",
  "Africa/Accra": "GH",
  "Africa/Lagos": "NG",
  "Africa/Douala": "CM",
  "Africa/Libreville": "GA",
  "Africa/Brazzaville": "CG",
  "Africa/Kinshasa": "CD",
  "Africa/Lubumbashi": "CD",
  "Africa/Casablanca": "MA",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
  "Africa/Cairo": "EG",
  "Africa/Johannesburg": "ZA",
  "Europe/Paris": "FR",
  "Europe/Brussels": "BE",
  "Europe/Zurich": "CH",
  "Europe/Luxembourg": "LU",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Lisbon": "PT",
  "Atlantic/Azores": "PT",
  "Atlantic/Madeira": "PT",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "America/Toronto": "CA",
  "America/Montreal": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Sao_Paulo": "BR",
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Qatar": "QA",
  "Asia/Kuwait": "KW",
  "Europe/Istanbul": "TR",
}

const LOCALE_TO_ISO: Record<string, string> = {
  SN: "SN",
  FR: "FR",
  BE: "BE",
  CH: "CH",
  LU: "LU",
  IT: "IT",
  ES: "ES",
  PT: "PT",
  DE: "DE",
  NL: "NL",
  GB: "GB",
  UK: "GB",
  IE: "IE",
  CA: "CA",
  US: "US",
  BR: "BR",
  AE: "AE",
  SA: "SA",
  QA: "QA",
  KW: "KW",
  TR: "TR",
  MA: "MA",
  DZ: "DZ",
  TN: "TN",
  ML: "ML",
  CI: "CI",
  GN: "GN",
  GM: "GM",
  MR: "MR",
  BF: "BF",
  NE: "NE",
  TG: "TG",
  BJ: "BJ",
  CV: "CV",
  GW: "GW",
  GH: "GH",
  NG: "NG",
  CM: "CM",
  GA: "GA",
  CG: "CG",
  CD: "CD",
  EG: "EG",
  ZA: "ZA",
}

function isoFromTimezone(tz: string): string | null {
  if (TZ_TO_ISO[tz]) return TZ_TO_ISO[tz]
  return null
}

function isoFromLocale(): string | null {
  if (typeof navigator === "undefined") return null
  const locales = [...(navigator.languages || []), navigator.language].filter(
    Boolean
  )
  for (const loc of locales) {
    const parts = loc.replace("_", "-").split("-")
    const region = parts[1]?.toUpperCase()
    if (region && LOCALE_TO_ISO[region]) return LOCALE_TO_ISO[region]
  }
  return null
}

export function isKnownPhoneIso(iso: string) {
  return PHONE_COUNTRIES.some((c) => c.iso === iso)
}

export function countryByIso(iso: string) {
  return PHONE_COUNTRIES.find((c) => c.iso === iso) || PHONE_COUNTRIES[0]
}

/** Détection locale (fuseau + langue navigateur), sans appel réseau. */
export function detectCountryIsoLocal(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    const fromTz = isoFromTimezone(tz)
    if (fromTz && isKnownPhoneIso(fromTz)) return fromTz
  } catch {
    /* ignore */
  }
  const fromLocale = isoFromLocale()
  if (fromLocale && isKnownPhoneIso(fromLocale)) return fromLocale
  return DEFAULT_PHONE_ISO
}

/** Sépare un numéro déjà complet (ex. "+221771234567") en iso + reste. */
export function splitPhone(value: string, preferredIso?: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) {
    return {
      iso: preferredIso || DEFAULT_PHONE_ISO,
      local: "",
    }
  }

  const sorted = [...PHONE_COUNTRIES].sort(
    (a, b) => b.dial.length - a.dial.length
  )
  for (const c of sorted) {
    if (!digits.startsWith(c.dial)) continue
    if (c.dial === "1") {
      const prefer =
        preferredIso === "CA" || preferredIso === "US" ? preferredIso : "US"
      return {
        iso: prefer,
        local: digits.slice(1),
      }
    }
    return { iso: c.iso, local: digits.slice(c.dial.length) }
  }

  return {
    iso: preferredIso || DEFAULT_PHONE_ISO,
    local: digits,
  }
}
