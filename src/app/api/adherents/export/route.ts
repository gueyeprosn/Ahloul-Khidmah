import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { canalLabel, parseMontantFcfa, statusLabel } from "@/lib/adherents-shared"
import { csvResponse, toCsv } from "@/lib/csv"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() || ""
  const fiche = searchParams.get("fiche") || ""
  const status = searchParams.get("status") || ""

  const where = {
    AND: [
      q
        ? {
            OR: [
              { nom: { contains: q } },
              { prenoms: { contains: q } },
              { id: { contains: q } },
              { tel: { contains: q } },
              { zoneRegion: { contains: q } },
              { profession: { contains: q } },
            ],
          }
        : {},
      fiche === "incomplete"
        ? { ficheComplete: false }
        : fiche === "complete"
          ? { ficheComplete: true }
          : {},
      ["actif", "en_attente", "archive"].includes(status) ? { status } : {},
    ],
  }

  const adherents = await prisma.adherent.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  const csv = toCsv(
    [
      "id",
      "nom",
      "prenoms",
      "tel",
      "email",
      "profession",
      "zone_region",
      "montant_fcfa",
      "canal",
      "statut",
      "fiche_complete",
      "badge_envoye_le",
      "cree_le",
    ],
    adherents.map((a) => [
      a.id,
      a.nom,
      a.prenoms,
      a.tel,
      a.email || "",
      a.profession === "À préciser" ? "" : a.profession,
      a.zoneRegion,
      parseMontantFcfa(a.montant, a.montantAutre),
      canalLabel(a.canal),
      statusLabel(a.status),
      a.ficheComplete ? "oui" : "non",
      a.badgeSentAt?.toISOString() || "",
      a.createdAt.toISOString(),
    ])
  )

  return csvResponse("adherents.csv", csv)
}
