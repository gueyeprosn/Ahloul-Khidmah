import { memberCardCaption, type MemberBadgeData } from "@/lib/member-badge"

/** Normalise un téléphone SN/local vers digits internationaux (sans +). */
export function normalizeWaPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "")
  if (!digits) return null

  if (digits.startsWith("00")) digits = digits.slice(2)

  if (digits.length === 9 && /^[76]/.test(digits)) {
    digits = `221${digits}`
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `221${digits.slice(1)}`
  }

  if (digits.startsWith("221") && digits.length >= 12) return digits
  if (digits.length >= 10 && digits.length <= 15) return digits

  return null
}

export function buildMemberCardWaMeUrl(data: MemberBadgeData): string | null {
  const phone = normalizeWaPhone(data.whatsapp || data.tel || "")
  if (!phone) return null
  const text = memberCardCaption(data)
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

/**
 * Partie nationale utile pour comparer deux numéros (indicatif différent,
 * troncature d’un chiffre, espaces, etc.).
 */
export function nationalPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("00")) digits = digits.slice(2)

  // Indicatifs fréquents pour cette asso (SN / FR / +autres)
  if (digits.startsWith("221") && digits.length >= 11) return digits.slice(3)
  if (digits.startsWith("33") && digits.length >= 11) {
    const rest = digits.slice(2)
    return rest.startsWith("0") ? rest.slice(1) : rest
  }

  if (digits.length === 10 && digits.startsWith("0")) return digits.slice(1)
  if (digits.length >= 9) return digits.slice(-9)
  return digits
}

export function phonesMatch(a: string, b: string) {
  const da = a.replace(/\D/g, "")
  const db = b.replace(/\D/g, "")
  if (!da || !db) return false
  if (da === db) return true

  const na = normalizeWaPhone(a)
  const nb = normalizeWaPhone(b)
  if (na && nb && na === nb) return true

  const ta = nationalPhoneDigits(a)
  const tb = nationalPhoneDigits(b)
  if (!ta || !tb) return false
  if (ta === tb) return true

  // Tolère un numéro tronqué à l’enregistrement (ex. 8 chiffres SN vs 9)
  if (ta.length >= 8 && tb.length >= 8) {
    if (ta.startsWith(tb) || tb.startsWith(ta)) return true
  }

  // Dernier filet : 9 derniers chiffres bruts
  const ra = da.length >= 9 ? da.slice(-9) : da
  const rb = db.length >= 9 ? db.slice(-9) : db
  return ra === rb
}
