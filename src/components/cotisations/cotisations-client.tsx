"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleDollarSign,
  Wallet,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { KpiCard } from "@/components/shared/kpi-card"
import { EmptyState } from "@/components/shared/empty-state"
import { InlineMessage } from "@/components/shared/inline-message"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { formatFcfa } from "@/lib/format"
import { canalLabel } from "@/lib/adherents-shared"
import { canalBucket } from "@/lib/canaux"
import { SoftPayPanel } from "@/components/payments/softpay-panel"
import { currentPeriode, labelPeriode, shiftPeriode } from "@/lib/periode"

export type CotisationRow = {
  adherentId: string
  nom: string
  prenoms: string
  tel: string
  celluleLocale: string
  canal: string
  expected: number
  periode: string
  statut: string
  cotisationId: string | null
  paidAt: string | null
  montantPaye: number | null
  paidCanal: string | null
}

export function CotisationsClient({
  periode,
  rows,
}: {
  periode: string
  rows: CotisationRow[]
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "error" | "success"
    text: string
  } | null>(null)
  const [softpay, setSoftpay] = useState<{
    paymentId: string
    adherentId: string
    phone: string
  } | null>(null)
  const [statutFilter, setStatutFilter] = useState<
    "all" | "paye" | "non_paye"
  >("all")
  const [canalFilter, setCanalFilter] = useState<"all" | "en_ligne" | "cellule">(
    "all"
  )

  const thisMonth = currentPeriode()

  function goPeriode(next: string) {
    router.push(`/cotisations?periode=${encodeURIComponent(next)}`)
  }

  async function markPaid(adherentId: string, canal: string) {
    setLoadingId(adherentId)
    setFeedback(null)
    try {
      const res = await fetch("/api/cotisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adherentId, periode, canal }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setFeedback({
          type: "error",
          text: data.error || "Impossible d'enregistrer le paiement",
        })
        return
      }
      setFeedback({ type: "success", text: "Paiement espèces enregistré." })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function cancelPaid(cotisationId: string, adherentId: string) {
    if (!confirm("Annuler ce paiement pour ce mois ?")) return
    setLoadingId(adherentId)
    setFeedback(null)
    try {
      const res = await fetch("/api/cotisations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "annuler", cotisationId }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setFeedback({
          type: "error",
          text: data.error || "Impossible d'annuler",
        })
        return
      }
      setFeedback({ type: "success", text: "Paiement annulé." })
      router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  async function payOnline(row: CotisationRow) {
    setLoadingId(row.adherentId)
    setFeedback(null)
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adherentId: row.adherentId,
          type: "cotisation",
          periode,
        }),
      })
      const data = (await res.json()) as {
        paymentId?: string
        error?: string
      }
      if (!res.ok || !data.paymentId) {
        setFeedback({
          type: "error",
          text: data.error || "Paiement en ligne indisponible",
        })
        return
      }
      setSoftpay({
        paymentId: data.paymentId,
        adherentId: row.adherentId,
        phone: row.tel,
      })
    } finally {
      setLoadingId(null)
    }
  }

  const paid = rows.filter((r) => r.statut === "paye")
  const unpaid = rows.filter((r) => r.statut !== "paye")
  const totalExpected = rows.reduce((s, r) => s + r.expected, 0)
  const totalPaid = paid.reduce((s, r) => s + (r.montantPaye ?? r.expected), 0)

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statutFilter === "paye" && r.statut !== "paye") return false
      if (statutFilter === "non_paye" && r.statut === "paye") return false
      if (canalFilter !== "all" && canalBucket(r.canal) !== canalFilter) {
        return false
      }
      return true
    })
  }, [rows, statutFilter, canalFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => goPeriode(shiftPeriode(periode, -1))}
        >
          <ChevronLeft className="size-4" />
          Mois préc.
        </Button>
        <label className="flex items-center gap-2 rounded-full border border-[#E6DCC0] bg-white px-3 py-1.5 text-sm">
          <CalendarDays className="size-4 text-[var(--ak-emerald-deep)]" />
          <input
            type="month"
            value={periode}
            onChange={(e) => {
              if (e.target.value) goPeriode(e.target.value)
            }}
            className="bg-transparent text-sm font-medium text-[var(--ak-emerald-deep)] outline-none"
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => goPeriode(shiftPeriode(periode, 1))}
        >
          Mois suiv.
          <ChevronRight className="size-4" />
        </Button>
        {periode !== thisMonth ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => goPeriode(thisMonth)}
          >
            Mois en cours
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Période"
          value={labelPeriode(periode)}
          description={periode === thisMonth ? "mois en cours" : periode}
          icon={CalendarDays}
        />
        <KpiCard
          title="Collecté"
          value={formatFcfa(totalPaid)}
          description={`${paid.length} payé(s)`}
          icon={Wallet}
        />
        <KpiCard
          title="Non payé"
          value={formatFcfa(Math.max(0, totalExpected - totalPaid))}
          description={`${unpaid.length} adhérent(s)`}
          icon={CircleDollarSign}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Tous"],
            ["paye", `Payés (${paid.length})`],
            ["non_paye", `Non payés (${unpaid.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatutFilter(key)}
            className={
              statutFilter === key
                ? "rounded-full border border-[var(--ak-emerald-deep)] bg-[var(--ak-emerald-deep)] px-3 py-1 text-xs font-medium text-white"
                : "rounded-full border border-[#E6DCC0] bg-white px-3 py-1 text-xs font-medium text-[var(--ak-ink-soft)] hover:border-[var(--ak-gold)]"
            }
          >
            {label}
          </button>
        ))}
        {(
          [
            ["all", "Tous canaux"],
            ["en_ligne", "En ligne"],
            ["cellule", "Cellule"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCanalFilter(key)}
            className={
              canalFilter === key
                ? "rounded-full border border-[var(--ak-gold)] bg-[var(--ak-gold)]/20 px-3 py-1 text-xs font-medium text-[var(--ak-emerald-deep)]"
                : "rounded-full border border-[#E6DCC0] bg-white px-3 py-1 text-xs font-medium text-[var(--ak-ink-soft)] hover:border-[var(--ak-gold)]"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {feedback ? (
        <InlineMessage message={feedback.text} variant={feedback.type} />
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun résultat"
          description={
            rows.length === 0
              ? "Aucun adhérent actif pour cette période."
              : "Aucun adhérent ne correspond à ces filtres."
          }
        />
      ) : (
        <DataTable>
          <DataTableRoot>
            <DataTableHead>
              <Th>Adhérent</Th>
              <Th className="hidden sm:table-cell">Cellule</Th>
              <Th>Montant</Th>
              <Th className="hidden md:table-cell">Canal</Th>
              <Th>Statut</Th>
              <Th>Action</Th>
            </DataTableHead>
            <DataTableBody>
              {filtered.map((row) => (
                <Tr key={row.adherentId}>
                  <Td>
                    <Link
                      href={`/adherents/${row.adherentId}`}
                      className="font-medium text-[var(--ak-emerald-deep)] hover:underline"
                    >
                      {row.prenoms} {row.nom}
                    </Link>
                  </Td>
                  <Td className="hidden text-muted-foreground sm:table-cell">
                    {row.celluleLocale === "À préciser"
                      ? "—"
                      : row.celluleLocale}
                  </Td>
                  <Td className="tabular-nums">{formatFcfa(row.expected)}</Td>
                  <Td className="hidden text-muted-foreground md:table-cell">
                    {canalLabel(row.paidCanal || row.canal)}
                  </Td>
                  <Td>
                    <StatusBadge
                      label={
                        row.statut === "paye" ? "Payé" : "Non payé ce mois"
                      }
                      variant={row.statut === "paye" ? "success" : "warning"}
                    />
                  </Td>
                  <Td>
                    {row.statut === "paye" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          loadingId === row.adherentId || !row.cotisationId
                        }
                        onClick={() =>
                          row.cotisationId
                            ? void cancelPaid(row.cotisationId, row.adherentId)
                            : undefined
                        }
                      >
                        Annuler
                      </Button>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
                          disabled={loadingId === row.adherentId}
                          onClick={() => void payOnline(row)}
                        >
                          {loadingId === row.adherentId
                            ? "…"
                            : "Payer en ligne"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === row.adherentId}
                          onClick={() =>
                            void markPaid(row.adherentId, row.canal)
                          }
                        >
                          Espèces
                        </Button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </DataTableBody>
          </DataTableRoot>
        </DataTable>
      )}

      <p className="text-xs text-muted-foreground">
        {paid.length} payé(s) · {unpaid.length} non payé(s) ·{" "}
        {labelPeriode(periode)}
      </p>

      {softpay ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--ak-ivory)] p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--ak-emerald-deep)]">
                Paiement en ligne
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSoftpay(null)}
              >
                Fermer
              </Button>
            </div>
            <SoftPayPanel
              paymentId={softpay.paymentId}
              defaultPhone={softpay.phone}
              onCompleted={() => {
                setSoftpay(null)
                setFeedback({
                  type: "success",
                  text: "Paiement confirmé.",
                })
                router.refresh()
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
