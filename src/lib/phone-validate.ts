import { PHONE_COUNTRIES } from "@/lib/phone-countries"

/**
 * Longueur attendue de la partie nationale (sans indicatif).
 * Priorité aux pays de la diaspora / Afrique de l’Ouest de l’asso.
 */
const LOCAL_LENGTH: Record<string, { min: number; max: number }> = {
  "221": { min: 9, max: 9 }, // Sénégal
  "220": { min: 7, max: 7 }, // Gambie
  "222": { min: 8, max: 8 }, // Mauritanie
  "223": { min: 8, max: 8 }, // Mali
  "224": { min: 9, max: 9 }, // Guinée
  "225": { min: 10, max: 10 }, // Côte d'Ivoire
  "226": { min: 8, max: 8 }, // Burkina
  "227": { min: 8, max: 8 }, // Niger
  "228": { min: 8, max: 8 }, // Togo
  "229": { min: 8, max: 10 }, // Bénin
  "238": { min: 7, max: 7 }, // Cap-Vert
  "245": { min: 7, max: 9 }, // Guinée-Bissau
  "233": { min: 9, max: 9 }, // Ghana
  "234": { min: 10, max: 10 }, // Nigeria
  "237": { min: 9, max: 9 }, // Cameroun
  "212": { min: 9, max: 9 }, // Maroc
  "213": { min: 9, max: 9 }, // Algérie
  "216": { min: 8, max: 8 }, // Tunisie
  "20": { min: 10, max: 10 }, // Égypte
  "33": { min: 9, max: 9 }, // France
  "32": { min: 8, max: 9 }, // Belgique
  "41": { min: 9, max: 9 }, // Suisse
  "39": { min: 9, max: 11 }, // Italie
  "34": { min: 9, max: 9 }, // Espagne
  "351": { min: 9, max: 9 }, // Portugal
  "49": { min: 10, max: 12 }, // Allemagne
  "31": { min: 9, max: 9 }, // Pays-Bas
  "44": { min: 10, max: 10 }, // UK
  "1": { min: 10, max: 10 }, // US / CA
  "971": { min: 9, max: 9 }, // EAU
  "966": { min: 9, max: 9 }, // Arabie
  "974": { min: 8, max: 8 }, // Qatar
  "27": { min: 9, max: 9 }, // Afrique du Sud
}

export type PhoneValidation =
  | { ok: true; e164: string; dial: string; local: string }
  | { ok: false; error: string }

function detectDial(digits: string): { dial: string; local: string } | null {
  const sorted = [...PHONE_COUNTRIES].sort(
    (a, b) => b.dial.length - a.dial.length
  )
  for (const c of sorted) {
    if (!digits.startsWith(c.dial)) continue
    const local = digits.slice(c.dial.length)
    if (!local) continue
    // +1 (US/CA) trop ambigu sur un fragment court
    if (c.dial === "1" && local.length < 6) continue
    return { dial: c.dial, local }
  }
  return null
}

/**
 * Vérifie qu’un numéro international est complet (longueur nationale attendue).
 * Ex. Sénégal : +221 + exactement 9 chiffres (70/75/76/77/78…).
 */
export function validateCompletePhone(input: string): PhoneValidation {
  let digits = input.replace(/\D/g, "")
  if (!digits) {
    return { ok: false, error: "Numéro de téléphone requis." }
  }
  if (digits.startsWith("00")) digits = digits.slice(2)

  // Numéro local SN saisi sans indicatif (9 chiffres démarrant par 7)
  if (digits.length === 9 && /^[76]\d{8}$/.test(digits)) {
    digits = `221${digits}`
  }
  // 0X… France / SN legacy
  if (digits.length === 10 && digits.startsWith("0")) {
    const rest = digits.slice(1)
    if (/^[67]\d{8}$/.test(rest)) {
      // Ambigu FR/SN — on laisse passer après ajout si déjà international sinon SN si 7x
      if (/^7[0-8]\d{7}$/.test(rest)) digits = `221${rest}`
      else digits = `33${rest}`
    }
  }

  const parsed = detectDial(digits)
  if (!parsed) {
    if (digits.length < 10 || digits.length > 15) {
      return {
        ok: false,
        error:
          "Numéro incomplet ou indicatif manquant. Utilisez le format international (ex. +221 77 123 45 67).",
      }
    }
    return { ok: true, e164: `+${digits}`, dial: "", local: digits }
  }

  const { dial, local } = parsed
  const rule = LOCAL_LENGTH[dial]

  if (rule) {
    if (local.length < rule.min) {
      const label =
        PHONE_COUNTRIES.find((c) => c.dial === dial)?.label || `+${dial}`
      return {
        ok: false,
        error: `Numéro incomplet pour ${label} : ${rule.min} chiffres attendus après +${dial} (vous en avez ${local.length}).`,
      }
    }
    if (local.length > rule.max) {
      const label =
        PHONE_COUNTRIES.find((c) => c.dial === dial)?.label || `+${dial}`
      return {
        ok: false,
        error: `Numéro trop long pour ${label} : ${rule.max} chiffres max après +${dial}.`,
      }
    }
  } else if (local.length < 7 || local.length > 12) {
    return {
      ok: false,
      error:
        "Numéro incomplet. Vérifiez l’indicatif et la longueur du numéro local.",
    }
  }

  // Sénégal mobile : 70, 75, 76, 77, 78
  if (dial === "221" && !/^7[0-8]\d{7}$/.test(local)) {
    return {
      ok: false,
      error:
        "Numéro sénégalais invalide : attendu 9 chiffres commençant par 70, 75, 76, 77 ou 78.",
    }
  }

  return { ok: true, e164: `+${dial}${local}`, dial, local }
}

export function assertCompletePhone(input: string): string {
  const result = validateCompletePhone(input)
  if (!result.ok) {
    const err = new Error("INCOMPLETE_PHONE")
    ;(err as Error & { detail?: string }).detail = result.error
    throw err
  }
  return result.e164
}
