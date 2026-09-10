export function formatFcfa(amount: number): string {
  // Intl produit des espaces insécables (U+00A0 / U+202F) : un montant un
  // peu long ne peut alors jamais revenir à la ligne et déborde de sa carte
  // sur un écran étroit. On les remplace par des espaces normales pour
  // autoriser le retour à la ligne quand la place manque.
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[  ]/g, " ")
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date)
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date)
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)
}
