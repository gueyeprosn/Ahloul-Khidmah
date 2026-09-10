/** Période cotisation YYYY-MM */

export function currentPeriode(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function isValidPeriode(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value))
}

export function parsePeriode(value: string | null | undefined) {
  return isValidPeriode(value) ? value : currentPeriode()
}

export function shiftPeriode(periode: string, deltaMonths: number) {
  const [y, m] = periode.split("-").map(Number)
  const d = new Date(y, m - 1 + deltaMonths, 1)
  return currentPeriode(d)
}

export function labelPeriode(periode: string) {
  const [y, m] = periode.split("-").map(Number)
  if (!y || !m) return periode
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1))
}
