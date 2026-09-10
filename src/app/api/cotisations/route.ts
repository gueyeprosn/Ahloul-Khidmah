import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { parseMontantFcfa } from "@/lib/adherents"
import { prisma } from "@/lib/db"
import { labelPeriode, parsePeriode } from "@/lib/periode"
import { cotisationCancelSchema, cotisationCreateSchema } from "@/features/cotisations/schema"
import { walletCredit, walletDebit } from "@/lib/wallet"
import { logAudit } from "@/lib/audit-log"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periode = parsePeriode(searchParams.get("periode"))

  const [actifs, paiements] = await Promise.all([
    // canal "don" exclu : pas de cotisation mensuelle attendue pour un
    // membre venu par un don (voir ensureAdherentFromContribution).
    prisma.adherent.findMany({
      where: { status: "actif", canal: { not: "don" } },
      orderBy: [{ nom: "asc" }, { prenoms: "asc" }],
    }),
    prisma.cotisation.findMany({
      where: { periode },
    }),
  ])

  const paidMap = new Map(paiements.map((p) => [p.adherentId, p]))

  const rows = actifs.map((a) => {
    const paid = paidMap.get(a.id)
    const expected = parseMontantFcfa(a.montant, a.montantAutre)
    return {
      adherentId: a.id,
      nom: a.nom,
      prenoms: a.prenoms,
      tel: a.tel,
      celluleLocale: a.celluleLocale,
      canal: a.canal,
      expected,
      periode,
      statut: paid?.statut === "paye" ? "paye" : "en_retard",
      cotisationId: paid?.id ?? null,
      paidAt: paid?.paidAt ?? null,
      montantPaye: paid?.montant ?? null,
      paidCanal: paid?.canal ?? null,
      note: paid?.note ?? null,
    }
  })

  return NextResponse.json({ periode, rows })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = cotisationCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const adherentId = parsed.data.adherentId
  const periode = parsePeriode(parsed.data.periode)
  const canal = parsed.data.canal || "cellule"
  const note = parsed.data.note || null

  const adherent = await prisma.adherent.findUnique({
    where: { id: adherentId },
  })
  if (!adherent) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 })
  }

  const montant = parseMontantFcfa(adherent.montant, adherent.montantAutre)

  const existing = await prisma.cotisation.findUnique({
    where: { adherentId_periode: { adherentId, periode } },
  })

  const cotisation = await prisma.cotisation.upsert({
    where: {
      adherentId_periode: { adherentId, periode },
    },
    update: {
      montant,
      canal: canal || adherent.canal,
      statut: "paye",
      paidAt: new Date(),
      note,
    },
    create: {
      adherentId,
      periode,
      montant,
      canal: canal || adherent.canal,
      statut: "paye",
      paidAt: new Date(),
      note,
    },
  })

  // Crédite le wallet uniquement au passage à "payé" — évite un double
  // crédit si cette période était déjà marquée payée (simple correction).
  if (existing?.statut !== "paye") {
    await walletCredit({
      adherentId,
      amount: montant,
      label: `Cotisation ${labelPeriode(periode)}`,
      reference: `cotisation:${cotisation.id}`,
    })
  }

  await logAudit(
    session,
    existing ? "cotisation.update" : "cotisation.record",
    "Cotisation",
    cotisation.id,
    `adhérent ${adherentId}, période ${periode}, ${montant} FCFA, canal ${canal}`
  )

  return NextResponse.json({ ok: true, cotisation })
}

/** Annule un paiement enregistré (espèces / correction). */
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = cotisationCancelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  }
  const { cotisationId } = parsed.data

  const existing = await prisma.cotisation.findUnique({
    where: { id: cotisationId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Cotisation introuvable" }, { status: 404 })
  }

  await prisma.cotisation.delete({ where: { id: cotisationId } })

  // Reflète l'annulation dans le wallet : la cotisation était payée,
  // donc son crédit doit être repris.
  if (existing.statut === "paye") {
    await walletDebit({
      adherentId: existing.adherentId,
      amount: existing.montant,
      label: `Annulation cotisation ${labelPeriode(existing.periode)}`,
      reference: `cotisation:${existing.id}`,
    })
  }

  await logAudit(
    session,
    "cotisation.update",
    "Cotisation",
    cotisationId,
    `annulation — adhérent ${existing.adherentId}, période ${existing.periode}, ${existing.montant} FCFA`
  )

  return NextResponse.json({ ok: true, deleted: cotisationId })
}
