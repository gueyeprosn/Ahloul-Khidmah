import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PrintButton } from "@/components/mon-espace/print-button"
import { buildMetadata } from "@/lib/seo"
import { getMemberSession } from "@/lib/member-auth"
import {
  canalLabel,
  getMemberHistory,
  historyKindLabel,
  summarizeHistory,
  type HistoryStatus,
} from "@/lib/member-history"

export const metadata: Metadata = buildMetadata({
  title: "Historique de mes versements",
  description: "Relevé imprimable de vos versements et contributions.",
  path: "/mon-espace/historique",
  noIndex: true,
})

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<HistoryStatus, string> = {
  confirme: "Confirmé",
  attente: "En attente",
  annule: "Annulé / échoué",
}

function fcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ") + " FCFA"
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v
}

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getMemberSession()
  if (!session) redirect("/mon-espace")

  const data = await getMemberHistory(session.adherentId)
  if (!data) redirect("/mon-espace")

  const sp = await searchParams
  const annee = one(sp.annee) ?? "all"
  const tout = one(sp.tout) === "1"

  const years = [
    ...new Set(data.entries.map((e) => new Date(e.date).getFullYear())),
  ].sort((a, b) => b - a)

  const filtered = data.entries.filter((e) => {
    if (annee !== "all" && String(new Date(e.date).getFullYear()) !== annee) {
      return false
    }
    return tout || e.status === "confirme"
  })
  const totals = summarizeHistory(filtered)
  const { adherent } = data
  const name = `${adherent.prenoms} ${adherent.nom}`.trim()
  const generatedAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Dakar",
  }).format(new Date())

  const query = (next: { annee?: string; tout?: boolean }) => {
    const params = new URLSearchParams()
    const a = next.annee ?? annee
    const t = next.tout ?? tout
    if (a !== "all") params.set("annee", a)
    if (t) params.set("tout", "1")
    const qs = params.toString()
    return `/mon-espace/historique${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #historique-print, #historique-print * { visibility: visible !important; }
          #historique-print {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none !important; box-shadow: none !important;
            padding: 0 !important; margin: 0 !important; background: #fff !important;
          }
          .no-print { display: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>
      <div
        aria-hidden
        className="no-print pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
      />
      <div
        id="historique-print"
        className="relative mx-auto max-w-3xl rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-6 shadow-xl md:p-8"
      >
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/mon-espace"
            className="text-sm font-medium text-[var(--ak-emerald-deep)] underline"
          >
            ← Retour à mon espace
          </Link>
          <PrintButton />
        </div>

        <h1 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
          Relevé de mes versements
        </h1>
        <p className="mt-1 text-sm text-[var(--ak-ink-soft)]">
          Ahloul Khidmah — www.ahloulkhidmah.org
        </p>

        <dl className="mt-5 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-[var(--ak-ink-soft)]">Membre :</dt>
            <dd className="font-medium">{name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[var(--ak-ink-soft)]">Téléphone :</dt>
            <dd className="font-medium">{adherent.tel}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[var(--ak-ink-soft)]">Cellule :</dt>
            <dd className="font-medium">{adherent.celluleLocale}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-[var(--ak-ink-soft)]">Période :</dt>
            <dd className="font-medium">
              {annee === "all" ? "Toutes les années" : annee}
            </dd>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <dt className="text-[var(--ak-ink-soft)]">Édité le :</dt>
            <dd className="font-medium">{generatedAt}</dd>
          </div>
        </dl>

        <div className="no-print mt-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--ak-ink-soft)]">Année :</span>
          {["all", ...years.map(String)].map((y) => (
            <Link
              key={y}
              href={query({ annee: y })}
              className={`rounded-full border px-3 py-1 ${
                y === annee
                  ? "border-[var(--ak-emerald-deep)] bg-[var(--ak-emerald-deep)] text-white"
                  : "border-[var(--ak-gold)]/60 bg-white"
              }`}
            >
              {y === "all" ? "Toutes" : y}
            </Link>
          ))}
          <Link
            href={query({ tout: !tout })}
            className="ml-auto rounded-full border border-[var(--ak-gold)]/60 bg-white px-3 py-1"
          >
            {tout ? "Masquer les non confirmés" : "Inclure les non confirmés"}
          </Link>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--ak-ink-soft)]">
            Aucun versement à afficher pour cette sélection.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--ak-emerald-deep)] text-left text-xs uppercase tracking-wide text-[var(--ak-ink-soft)]">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Référence</th>
                  <th className="py-2 pr-3">Nature</th>
                  <th className="py-2 pr-3">Moyen</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.ref}
                    className="border-b border-[var(--ak-gold)]/30 align-top"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("fr-FR", {
                        timeZone: "Africa/Dakar",
                      })}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{e.ref}</td>
                    <td className="py-2 pr-3">
                      <span className="font-medium">
                        {historyKindLabel(e.kind)}
                      </span>
                      <span className="block text-xs capitalize text-[var(--ak-ink-soft)]">
                        {e.label.replace(/^[^—]*—\s*/, "")}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{canalLabel(e.canal)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {STATUS_LABEL[e.status]}
                    </td>
                    <td className="py-2 text-right font-semibold whitespace-nowrap">
                      {fcfa(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Adhésion</span>
            <span>{fcfa(totals.adhesion)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cotisations</span>
            <span>{fcfa(totals.cotisation)}</span>
          </div>
          <div className="flex justify-between">
            <span>Contributions</span>
            <span>{fcfa(totals.don)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-[var(--ak-emerald-deep)] pt-1 text-base font-semibold">
            <span>Total confirmé</span>
            <span>{fcfa(totals.all)}</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--ak-ink-soft)]">
          Seuls les versements au statut « Confirmé » sont comptés dans les
          totaux. Un versement « En attente » n&apos;a pas encore été validé.
          Les paiements faits hors du site (par exemple directement par Wave)
          apparaissent une fois enregistrés par l&apos;association. Ce relevé est
          informatif ; conservez aussi vos reçus de paiement.
        </p>
      </div>
    </section>
  )
}
