import { PageHeader } from "@/components/shared/page-header"
import {
  CotisationsClient,
  type CotisationRow,
} from "@/components/cotisations/cotisations-client"
import { parseMontantFcfa } from "@/lib/adherents"
import { prisma } from "@/lib/db"
import { parsePeriode } from "@/lib/periode"

export const metadata = { title: "Cotisations" }

export default async function CotisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>
}) {
  const params = await searchParams
  const periode = parsePeriode(params.periode)
  const [actifs, paiements] = await Promise.all([
    // canal "don" exclu : un membre venu par un don n'a pas de cotisation
    // mensuelle attendue (voir ensureAdherentFromContribution).
    prisma.adherent.findMany({
      where: { status: "actif", canal: { not: "don" } },
      orderBy: [{ nom: "asc" }, { prenoms: "asc" }],
    }),
    prisma.cotisation.findMany({ where: { periode } }),
  ])

  const paidMap = new Map(paiements.map((p) => [p.adherentId, p]))
  const rows: CotisationRow[] = actifs.map((a) => {
    const paid = paidMap.get(a.id)
    return {
      adherentId: a.id,
      nom: a.nom,
      prenoms: a.prenoms,
      tel: a.tel,
      celluleLocale: a.celluleLocale,
      canal: a.canal,
      expected: parseMontantFcfa(a.montant, a.montantAutre),
      periode,
      statut: paid?.statut === "paye" ? "paye" : "en_retard",
      cotisationId: paid?.id ?? null,
      paidAt: paid?.paidAt?.toISOString() ?? null,
      montantPaye: paid?.montant ?? null,
      paidCanal: paid?.canal ?? null,
    }
  })

  return (
    <>
      <PageHeader
        title="Cotisations"
        description="Suivi par mois — SoftPay (Wave / Orange Money) ou versement cellule."
      />
      <CotisationsClient periode={periode} rows={rows} />
    </>
  )
}
