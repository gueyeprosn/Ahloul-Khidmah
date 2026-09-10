import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { canalLabel } from "@/lib/adherents-shared"
import { campagneLabel } from "@/features/contributions/schema"
import { csvResponse, toCsv } from "@/lib/csv"
import { parsePeriode } from "@/lib/periode"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "cotisations"
  const periode = parsePeriode(searchParams.get("periode"))

  if (type === "contributions") {
    const [y, m] = periode.split("-").map(Number)
    const from = new Date(y, m - 1, 1)
    const to = new Date(y, m, 1)
    const rows = await prisma.contribution.findMany({
      where: { createdAt: { gte: from, lt: to } },
      orderBy: { createdAt: "desc" },
    })
    const csv = toCsv(
      ["date", "prenoms", "nom", "tel", "montant", "campagne", "statut"],
      rows.map((c) => [
        c.createdAt.toISOString(),
        c.prenoms || "",
        c.nom || "",
        c.tel || "",
        c.amount,
        campagneLabel(c.campagne),
        c.status,
      ])
    )
    return csvResponse(`contributions-${periode}.csv`, csv)
  }

  const rows = await prisma.cotisation.findMany({
    where: { periode },
    include: { adherent: true },
    orderBy: { paidAt: "desc" },
  })
  const csv = toCsv(
    ["periode", "adherent_id", "nom", "prenoms", "montant", "canal", "statut", "paye_le"],
    rows.map((c) => [
      c.periode,
      c.adherentId,
      c.adherent?.nom || "",
      c.adherent?.prenoms || "",
      c.montant,
      canalLabel(c.canal),
      c.statut,
      c.paidAt?.toISOString() || "",
    ])
  )
  return csvResponse(`cotisations-${periode}.csv`, csv)
}
