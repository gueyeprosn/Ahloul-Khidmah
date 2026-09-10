import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { buildDetailedReport, parsePeriode } from "@/lib/rapports-detail"
import { buildReportPdf } from "@/lib/rapports-pdf"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const periode = parsePeriode(new URL(request.url).searchParams.get("periode"))
  const report = await buildDetailedReport(periode)
  const bytes = await buildReportPdf(report)

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-ahloul-khidmah-${periode}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
