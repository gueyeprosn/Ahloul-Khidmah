/** Génère un numéro d'identification unique Ahloul Khidma. Format: AK-YYYYMMDD-XXXXXX */
export function generateAdhesionId(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(36).toUpperCase().padStart(2, "0"))
    .join("")
    .slice(0, 6)

  return `AK-${y}${m}${d}-${rand}`
}

export type AdhesionTicket = {
  id: string
  nom: string
  prenoms: string
  celluleLocale: string
  zoneRegion: string
  profession: string
  montant: string
  canal: string
  tel: string
  createdAt: string
  status?: string
}

/** URL de validation sans PII — vérification côté serveur uniquement. */
export function buildValidationUrl(ticket: Pick<AdhesionTicket, "id">): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
          "https://www.ahloulkhidmah.org")
  return `${origin}/valider/${encodeURIComponent(ticket.id)}`
}

const STORAGE_KEY = "ahloul-khidma-adhesions"

export function persistTicket(ticket: AdhesionTicket) {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: AdhesionTicket[] = raw ? JSON.parse(raw) : []
    list.unshift(ticket)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)))
  } catch {
    // ignore quota / private mode
  }
}

export function formatMontantLabel(montant: string, montantAutre?: string) {
  if (montant === "autre")
    return montantAutre?.trim() ? `${montantAutre} FCFA` : "Autre"
  if (montant === "1400") return "1 400 FCFA / mois"
  if (montant === "14000") return "14 000 FCFA / mois"
  if (montant === "140000") return "140 000 FCFA / mois"
  return montant
}
