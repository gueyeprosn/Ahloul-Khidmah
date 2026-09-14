export type Granularity = "jour" | "semaine" | "mois"

export type CollecteBucket = {
  key: string
  label: string
  cotisations: number
  dons: number
  total: number
}

export const GRANULARITY_COUNT: Record<Granularity, number> = {
  jour: 30,
  semaine: 12,
  mois: 12,
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// Semaine ISO (début lundi), cohérent avec l'usage local.
function startOfWeek(d: Date) {
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday))
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function bucketStart(date: Date, granularity: Granularity): Date {
  if (granularity === "jour") return startOfDay(date)
  if (granularity === "semaine") return startOfWeek(date)
  return startOfMonth(date)
}

function bucketKey(date: Date, granularity: Granularity): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  if (granularity === "mois") return `${y}-${m}`
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function bucketLabel(date: Date, granularity: Granularity): string {
  if (granularity === "jour") {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(date)
  }
  if (granularity === "semaine") {
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 6)
    const fmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" })
    return `${fmt.format(date)} – ${fmt.format(end)}`
  }
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function shiftBucket(date: Date, granularity: Granularity, delta: number): Date {
  if (granularity === "jour") return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta)
  if (granularity === "semaine") return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta * 7)
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

/**
 * Regroupe des encaissements (cotisations + dons) en compartiments jour /
 * semaine / mois, sur une fenêtre glissante de `count` compartiments se
 * terminant à `now`. Les compartiments sans encaissement apparaissent avec
 * des montants à zéro, pour un affichage continu.
 */
export function buildCollecteSeries(
  cotisations: { date: Date; montant: number }[],
  dons: { date: Date; montant: number }[],
  granularity: Granularity,
  count: number,
  now = new Date()
): CollecteBucket[] {
  const nowStart = bucketStart(now, granularity)
  const buckets = new Map<string, CollecteBucket>()
  for (let i = count - 1; i >= 0; i--) {
    const d = shiftBucket(nowStart, granularity, -i)
    const key = bucketKey(d, granularity)
    buckets.set(key, { key, label: bucketLabel(d, granularity), cotisations: 0, dons: 0, total: 0 })
  }

  for (const c of cotisations) {
    const key = bucketKey(bucketStart(c.date, granularity), granularity)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.cotisations += c.montant
      bucket.total += c.montant
    }
  }
  for (const d of dons) {
    const key = bucketKey(bucketStart(d.date, granularity), granularity)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.dons += d.montant
      bucket.total += d.montant
    }
  }

  return [...buckets.values()].reverse()
}
