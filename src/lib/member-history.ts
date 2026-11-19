import { prisma } from "@/lib/db"
import { labelPeriode } from "@/lib/periode"
import { phonesMatch } from "@/lib/whatsapp-shared"

export type HistoryKind = "adhesion" | "cotisation" | "don"
export type HistoryStatus = "confirme" | "attente" | "annule"

export type HistoryEntry = {
  /** Référence imprimée sur le relevé (courte, stable). */
  ref: string
  date: string // ISO
  kind: HistoryKind
  label: string
  amount: number
  status: HistoryStatus
  canal: string
}

const KIND_LABEL: Record<HistoryKind, string> = {
  adhesion: "Adhésion",
  cotisation: "Cotisation",
  don: "Contribution",
}

const CANAL_LABEL: Record<string, string> = {
  paydunya: "En ligne (PayDunya)",
  wave: "Wave",
  cash: "Espèces",
  especes: "Espèces",
  cellule: "Cellule",
  don: "Contribution",
}

export function canalLabel(canal: string) {
  return CANAL_LABEL[canal] ?? canal
}

export function historyKindLabel(kind: HistoryKind) {
  return KIND_LABEL[kind]
}

function paymentStatus(status: string): HistoryStatus {
  if (status === "completed") return "confirme"
  if (status === "pending") return "attente"
  return "annule"
}

function parsePeriodes(raw: string | null, fallback: string | null) {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (
        Array.isArray(parsed) &&
        parsed.length &&
        parsed.every((p) => typeof p === "string")
      ) {
        return parsed as string[]
      }
    } catch {
      // brouillon corrompu — repli sur `periode`
    }
  }
  return fallback ? [fallback] : []
}

function shortRef(prefix: string, id: string) {
  return `${prefix}-${id.slice(-8).toUpperCase()}`
}

/**
 * Historique de tous les versements d'un membre : adhésion, cotisations et
 * contributions. Trois sources, dédoublonnées :
 *  - les paiements rattachés à la fiche (adhésion, cotisation, don) ;
 *  - les contributions faites avec son numéro (don sans fiche rattachée) ;
 *  - les cotisations saisies à la main (espèces, Wave…) qui n'ont pas de
 *    paiement en ligne correspondant.
 */
export async function getMemberHistory(adherentId: string) {
  const adherent = await prisma.adherent.findUnique({
    where: { id: adherentId },
    select: {
      id: true,
      nom: true,
      prenoms: true,
      tel: true,
      whatsapp: true,
      celluleLocale: true,
      memberNumber: true,
    },
  })
  if (!adherent) return null

  const [ownPayments, donCandidates, cotisations] = await Promise.all([
    prisma.payment.findMany({
      where: { adherentId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { type: "don", adherentId: null, customerPhone: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 2000,
    }),
    prisma.cotisation.findMany({
      where: { adherentId },
      orderBy: { periode: "desc" },
    }),
  ])

  const entries: HistoryEntry[] = []
  const coveredPeriodes = new Set<string>()

  for (const p of ownPayments) {
    const kind = (
      p.type === "adhesion" || p.type === "cotisation" ? p.type : "don"
    ) as HistoryKind
    const status = paymentStatus(p.status)
    const periodes =
      kind === "don" ? [] : parsePeriodes(p.periodes, p.periode)
    if (status === "confirme") periodes.forEach((x) => coveredPeriodes.add(x))

    let label = KIND_LABEL[kind]
    if (periodes.length === 1) label += ` — ${labelPeriode(periodes[0])}`
    else if (periodes.length > 1) {
      label += ` — ${periodes.map(labelPeriode).join(", ")}`
    }
    entries.push({
      ref: shortRef("PAY", p.id),
      date: (status === "confirme" ? p.updatedAt : p.createdAt).toISOString(),
      kind,
      label,
      amount: p.amount,
      status,
      canal: "paydunya",
    })
  }

  const phones = [adherent.tel, adherent.whatsapp].filter(
    (x): x is string => Boolean(x)
  )
  for (const p of donCandidates) {
    if (!p.customerPhone) continue
    if (!phones.some((t) => phonesMatch(t, p.customerPhone!))) continue
    entries.push({
      ref: shortRef("PAY", p.id),
      date: (p.status === "completed" ? p.updatedAt : p.createdAt).toISOString(),
      kind: "don",
      label: KIND_LABEL.don,
      amount: p.amount,
      status: paymentStatus(p.status),
      canal: "paydunya",
    })
  }

  for (const c of cotisations) {
    if (coveredPeriodes.has(c.periode)) continue
    entries.push({
      ref: shortRef("COT", c.id),
      date: (c.paidAt ?? c.createdAt).toISOString(),
      kind: "cotisation",
      label: `Cotisation — ${labelPeriode(c.periode)}`,
      amount: c.montant,
      status: c.statut === "paye" ? "confirme" : "attente",
      canal: c.canal,
    })
  }

  entries.sort((a, b) => b.date.localeCompare(a.date))
  return { adherent, entries }
}

export function summarizeHistory(entries: HistoryEntry[]) {
  const total = { adhesion: 0, cotisation: 0, don: 0, all: 0 }
  for (const e of entries) {
    if (e.status !== "confirme") continue
    total[e.kind] += e.amount
    total.all += e.amount
  }
  return total
}
