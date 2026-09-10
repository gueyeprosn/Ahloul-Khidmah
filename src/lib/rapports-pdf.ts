import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { DetailedReport } from "@/lib/rapports-detail"
import { formatFcfa } from "@/lib/format"

export async function buildReportPdf(report: DetailedReport) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const green = rgb(0.04, 0.23, 0.15)
  const ink = rgb(0.12, 0.14, 0.11)
  const muted = rgb(0.35, 0.35, 0.32)

  let page = doc.addPage([595, 842])
  let y = 800

  const ensure = (need = 24) => {
    if (y < 50 + need) {
      page = doc.addPage([595, 842])
      y = 800
    }
  }

  const line = (text: string, size = 10, isBold = false, color = ink) => {
    ensure()
    page.drawText(text.slice(0, 110), {
      x: 48,
      y,
      size,
      font: isBold ? bold : font,
      color,
    })
    y -= size + 6
  }

  line("AHLOUL KHIDMAH", 16, true, green)
  line("Rapport organisationnel", 12, true)
  line(`Période : ${report.periodeLabel}`, 11)
  line(`Réf. AK-RPT-${report.periode.replace("-", "")}`, 9, false, muted)
  y -= 8

  line("1. Synthèse", 13, true, green)
  const k = report.kpis
  line(`Adhérents totaux : ${k.total}   Actifs : ${k.actifs}`)
  line(`Archivés : ${k.archives}   En attente : ${k.enAttente}`)
  line(`Fiches incomplètes : ${k.fichesIncompletes}   Nouveaux : ${k.nouveaux}`)
  line(
    `Collecté : ${formatFcfa(k.collecté)}   Engagement : ${formatFcfa(k.engagement)}`
  )
  line(`Impayés : ${k.unpaidCount} (${formatFcfa(k.unpaidAmount)})`)
  line(
    `Contributions confirmées : ${k.contributionsCount} · ${formatFcfa(k.contributionsAmount)}`
  )
  y -= 6

  line("2. Canaux", 13, true, green)
  for (const ch of report.channels) {
    line(
      `${ch.label} — engagement ${formatFcfa(ch.engagement)} / collecté ${formatFcfa(ch.collecté)}`
    )
  }
  y -= 6

  line("3. Impayés (extrait)", 13, true, green)
  for (const row of report.unpaidActifs.slice(0, 25)) {
    line(`${row.name} · ${row.cellule} · ${formatFcfa(row.expected)}`)
  }
  if (report.unpaidActifs.length > 25) {
    line(`… ${report.unpaidActifs.length - 25} autre(s)`)
  }
  y -= 6

  line("4. Cotisations payées (extrait)", 13, true, green)
  for (const row of report.paidRows.slice(0, 25)) {
    line(`${row.name} · ${formatFcfa(row.montant)} · ${row.canal}`)
  }

  y -= 10
  line("Document interne Ahloul Khidmah", 8, false, muted)

  return doc.save()
}
