import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { canalLabel, parseMontantFcfa, statusLabel } from "@/lib/adherents-shared"

async function buildCsv() {
  const adherents = await prisma.adherent.findMany({
    orderBy: { createdAt: "desc" },
  })

  const header = [
    "id",
    "nom",
    "prenoms",
    "tel",
    "email",
    "cellule",
    "zone",
    "profession",
    "domaines",
    "montant_fcfa",
    "canal",
    "statut",
    "cree_le",
  ]

  const lines = adherents.map((a) => {
    let domaines: string[] = []
    try {
      domaines = JSON.parse(a.domaines || "[]") as string[]
    } catch {
      domaines = []
    }
    return [
      a.id,
      a.nom,
      a.prenoms,
      a.tel,
      a.email || "",
      a.celluleLocale,
      a.zoneRegion,
      a.profession,
      domaines.join("|"),
      String(parseMontantFcfa(a.montant, a.montantAutre)),
      canalLabel(a.canal),
      statusLabel(a.status),
      a.createdAt.toISOString(),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  })

  return [header.join(","), ...lines].join("\n")
}

/** Export CSV — POST uniquement (anti CSRF via cookie SameSite + méthode). */
export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const csv = await buildCsv()
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="adherents-ahloul-khidmah.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

export async function GET() {
  return NextResponse.json(
    { error: "Utilisez POST pour exporter" },
    { status: 405 }
  )
}
