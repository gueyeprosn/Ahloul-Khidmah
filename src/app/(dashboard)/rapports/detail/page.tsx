import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { FilterChips } from "@/components/shared/filter-chips"
import { Button } from "@/components/ui/button"
import { RapportDocument } from "@/components/rapports/rapport-document"
import { ExportPdfButton } from "@/components/rapports/export-pdf-button"
import {
  buildDetailedReport,
  parsePeriode,
  shiftPeriode,
} from "@/lib/rapports-detail"
import "../rapport-print.css"

export const metadata = { title: "Rapport détaillé PDF" }

export default async function RapportDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>
}) {
  const { periode: periodeParam } = await searchParams
  const periode = parsePeriode(periodeParam)
  const report = await buildDetailedReport(periode)
  const prev = shiftPeriode(periode, -1)
  const next = shiftPeriode(periode, 1)
  const current = parsePeriode()

  return (
    <>
      <div className="ak-no-print space-y-6">
        <PageHeader
          title="Rapport détaillé"
          description={`Document structuré pour ${report.periodeLabel} — prêt à exporter en PDF.`}
          actions={
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/rapports?periode=${periode}`}>
                  <ArrowLeft className="size-3.5" />
                  Synthèse
                </Link>
              </Button>
              <ExportPdfButton periodeLabel={report.periodeLabel} />
              <Button size="sm" variant="outline" asChild>
                <a href={`/api/rapports/pdf?periode=${periode}`}>
                  Télécharger PDF serveur
                </a>
              </Button>
            </>
          }
        />

        <FilterChips
          chips={[
            {
              href: `/rapports/detail?periode=${prev}`,
              label: `← ${prev}`,
            },
            {
              href: `/rapports/detail?periode=${periode}`,
              label: periode,
              active: true,
            },
            {
              href: `/rapports/detail?periode=${next}`,
              label: `${next} →`,
            },
            {
              href: `/rapports/detail?periode=${current}`,
              label: "Mois courant",
              active: periode === current,
            },
          ]}
        />

        <p className="rounded-xl border border-[#E6DCC0] bg-white px-4 py-3 text-sm text-[var(--ak-ink-soft)]">
          Cliquez sur <strong className="text-[var(--ak-emerald-deep)]">Exporter PDF</strong>{" "}
          puis choisissez « Enregistrer au format PDF » dans la boîte
          d&apos;impression. Mise en page A4 Ahloul Khidmah (en-tête, sections
          numérotées, tableaux).
        </p>
      </div>

      <div className="ak-rapport-preview-shell">
        <RapportDocument report={report} />
      </div>
    </>
  )
}
