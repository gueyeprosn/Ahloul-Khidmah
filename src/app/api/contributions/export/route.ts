import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { campagneLabel } from "@/features/contributions/schema"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const rows = await prisma.contribution.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
  })

  const header = [
    "date",
    "prenoms",
    "nom",
    "tel",
    "email",
    "montant",
    "campagne",
    "statut",
  ]
  const lines = [
    header.join(";"),
    ...rows.map((c) =>
      [
        c.createdAt.toISOString(),
        c.prenoms || "",
        c.nom || "",
        c.tel || "",
        c.email || "",
        String(c.amount),
        campagneLabel(c.campagne),
        c.status,
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(";")
    ),
  ]

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contributions.csv"',
    },
  })
}
