import Link from "next/link"
import {
  ArrowUpRight,
  Plus,
  Users,
  Wallet,
  UserPlus,
  FileWarning,
  HeartHandshake,
  CircleCheck,
  PiggyBank,
  MapPinned,
  KeyRound,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { AlertBanner } from "@/components/shared/alert-banner"
import { SectionCard } from "@/components/shared/section-card"
import { EmptyState } from "@/components/shared/empty-state"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { Button } from "@/components/ui/button"
import { formatDate, formatFcfa } from "@/lib/format"
import { prisma } from "@/lib/db"
import { parseMontantFcfa, statusLabel } from "@/lib/adherents"
import { canalBucket } from "@/lib/canaux"

function currentPeriode() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default async function DashboardPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periode = currentPeriode()

  const [
    totalActifs,
    nouvellesMois,
    enAttente,
    fichesIncompletes,
    badgesMois,
    recent,
    cotisationsCeMois,
    contributionsCeMois,
    actifsEngagement,
    cotisationsPayeesPeriode,
    totalCotisationsAllTime,
    totalDonsAllTime,
    celluleActives,
    pinConfigures,
    totalActifsCotisants,
  ] = await Promise.all([
    prisma.adherent.count({ where: { status: "actif" } }),
    prisma.adherent.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.adherent.count({ where: { status: "en_attente" } }),
    prisma.adherent.count({ where: { ficheComplete: false } }),
    prisma.adherent.count({
      where: { badgeSentAt: { gte: monthStart } },
    }),
    prisma.adherent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // Argent réellement encaissé ce mois-ci (date de paiement), pas la
    // période couverte — un adhérent en retard peut régler plusieurs mois
    // d'un coup, ces versements doivent compter dans le total du mois.
    prisma.cotisation.findMany({
      where: { statut: "paye", paidAt: { gte: monthStart } },
      select: { montant: true, canal: true },
    }),
    prisma.contribution.findMany({
      where: { status: "completed", updatedAt: { gte: monthStart } },
      select: { amount: true },
    }),
    prisma.adherent.findMany({
      where: { status: "actif" },
      select: { montant: true, montantAutre: true },
    }),
    // Membres actifs à jour de cotisation pour le mois en cours (indicateur
    // de recouvrement, distinct du montant encaissé "ce mois-ci" ci-dessus).
    prisma.cotisation.count({ where: { periode, statut: "paye" } }),
    prisma.cotisation.aggregate({
      _sum: { montant: true },
      where: { statut: "paye" },
    }),
    prisma.contribution.aggregate({
      _sum: { amount: true },
      where: { status: "completed" },
    }),
    prisma.cellule.count({ where: { adherents: { some: { status: "actif" } } } }),
    prisma.adherent.count({
      where: { status: "actif", pinHash: { not: null } },
    }),
    // Membres avec cotisation mensuelle attendue (exclut canal "don" — voir
    // ensureAdherentFromContribution) : dénominateur du taux de cotisation.
    prisma.adherent.count({
      where: { status: "actif", canal: { not: "don" } },
    }),
  ])

  const cotisationsMontant = cotisationsCeMois.reduce((s, c) => s + c.montant, 0)
  const donsMontant = contributionsCeMois.reduce((s, c) => s + c.amount, 0)
  const collecté = cotisationsMontant + donsMontant
  const engagement = actifsEngagement.reduce(
    (s, a) => s + parseMontantFcfa(a.montant, a.montantAutre),
    0
  )

  const tauxCotisation =
    totalActifsCotisants > 0
      ? Math.round((cotisationsPayeesPeriode / totalActifsCotisants) * 100)
      : 0
  const collecteTotal =
    (totalCotisationsAllTime._sum.montant ?? 0) +
    (totalDonsAllTime._sum.amount ?? 0)
  const tauxPin =
    totalActifs > 0 ? Math.round((pinConfigures / totalActifs) * 100) : 0

  let enLigne = 0
  let cellule = 0
  for (const c of cotisationsCeMois) {
    if (canalBucket(c.canal) === "cellule") cellule += c.montant
    else enLigne += c.montant
  }
  const canalTotal = enLigne + cellule + donsMontant || 1
  const channels = [
    {
      label: "Cotisations en ligne (Wave, Orange Money, carte)",
      amount: enLigne,
      value: Math.round((enLigne / canalTotal) * 100),
    },
    {
      label: "Cotisations versement manuel (espèces)",
      amount: cellule,
      value: Math.round((cellule / canalTotal) * 100),
    },
    {
      label: "Dons",
      amount: donsMontant,
      value: Math.round((donsMontant / canalTotal) * 100),
    },
  ]

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Suivi des adhésions et cotisations Ahloul Khidmah."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/rapports">
                Voir les rapports
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
            <Button
              size="sm"
              className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
              asChild
            >
              <Link href="/adherents/nouveau">
                <Plus className="size-3.5" />
                Nouvelle adhésion
              </Link>
            </Button>
          </>
        }
      />

      {(fichesIncompletes > 0 || enAttente > 0) && (
        <div className="space-y-3">
          {fichesIncompletes > 0 ? (
            <AlertBanner
              variant="warning"
              title={`${fichesIncompletes} fiche${fichesIncompletes > 1 ? "s" : ""} incomplète${fichesIncompletes > 1 ? "s" : ""}`}
              description="Complétez les dossiers membres pour un annuaire fiable."
              href="/adherents?fiche=incomplete"
              linkLabel="Ouvrir la file"
            />
          ) : null}
          {enAttente > 0 ? (
            <AlertBanner
              variant="info"
              title={`${enAttente} adhésion${enAttente > 1 ? "s" : ""} en attente`}
              href="/adherents?status=en_attente"
              linkLabel="Traiter"
            />
          ) : null}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Adhérents actifs"
          value={String(totalActifs)}
          description="en base"
          icon={Users}
        />
        <KpiCard
          title="Collecté ce mois"
          value={formatFcfa(collecté)}
          description={
            donsMontant > 0
              ? `dont ${formatFcfa(donsMontant)} de dons`
              : engagement > 0
                ? `sur ${formatFcfa(engagement)} d'engagement`
                : `période ${periode}`
          }
          icon={Wallet}
        />
        <KpiCard
          title="Dons ce mois"
          value={formatFcfa(donsMontant)}
          description={`${contributionsCeMois.length} don${contributionsCeMois.length > 1 ? "s" : ""}`}
          icon={HeartHandshake}
        />
        <KpiCard
          title="Fiches incomplètes"
          value={String(fichesIncompletes)}
          description="à compléter"
          icon={FileWarning}
        />
        <KpiCard
          title="Badges envoyés"
          value={String(badgesMois)}
          description={`${nouvellesMois} nouvelle${nouvellesMois > 1 ? "s" : ""} adhésion${nouvellesMois > 1 ? "s" : ""} ce mois`}
          icon={UserPlus}
        />
      </section>

      <h2 className="text-sm font-semibold text-[var(--ak-ink-soft)]">
        Indicateurs complémentaires
      </h2>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Cotisations à jour"
          value={`${tauxCotisation}%`}
          description={`${cotisationsPayeesPeriode}/${totalActifsCotisants} actifs pour ${periode}`}
          icon={CircleCheck}
        />
        <KpiCard
          title="Collecté depuis le début"
          value={formatFcfa(collecteTotal)}
          description="cotisations + dons cumulés"
          icon={PiggyBank}
        />
        <KpiCard
          title="Cellules actives"
          value={String(celluleActives)}
          description="avec au moins un membre actif"
          icon={MapPinned}
        />
        <KpiCard
          title="Espace membre activé"
          value={`${tauxPin}%`}
          description={`${pinConfigures}/${totalActifs} ont un code PIN`}
          icon={KeyRound}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="Adhésions récentes"
          description="Dernières fiches enregistrées."
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/adherents">
                Tout voir
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          }
          flush
        >
          {recent.length === 0 ? (
            <EmptyState
              className="border-0 py-10"
              title="Aucune adhésion"
              description="Les inscriptions du site public apparaîtront ici."
              action={{ label: "Nouvelle adhésion", href: "/adherents/nouveau" }}
            />
          ) : (
            <DataTable className="rounded-none border-0">
              <DataTableRoot>
                <DataTableHead>
                  <Th>Adhérent</Th>
                  <Th className="hidden sm:table-cell">Région</Th>
                  <Th>Montant</Th>
                  <Th className="hidden md:table-cell">Date</Th>
                  <Th>Statut</Th>
                </DataTableHead>
                <DataTableBody>
                  {recent.map((row) => {
                    const label = statusLabel(row.status)
                    const amount = parseMontantFcfa(
                      row.montant,
                      row.montantAutre
                    )
                    const region = row.zoneRegion || "—"
                    return (
                      <Tr key={row.id}>
                        <Td>
                          <Link
                            href={`/adherents/${row.id}`}
                            className="font-medium text-[var(--ak-emerald-deep)] hover:underline"
                          >
                            {row.prenoms} {row.nom}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {row.id}
                            {!row.ficheComplete ? " · fiche incomplète" : ""}
                          </div>
                        </Td>
                        <Td className="hidden text-muted-foreground sm:table-cell">
                          {region}
                        </Td>
                        <Td className="tabular-nums">{formatFcfa(amount)}</Td>
                        <Td className="hidden text-muted-foreground md:table-cell">
                          {formatDate(row.createdAt)}
                        </Td>
                        <Td>
                          <StatusBadge
                            label={label}
                            variant={
                              label === "Actif"
                                ? "success"
                                : label === "En attente"
                                  ? "warning"
                                  : "neutral"
                            }
                          />
                        </Td>
                      </Tr>
                    )
                  })}
                </DataTableBody>
              </DataTableRoot>
            </DataTable>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          title="Répartition des encaissements"
          description="Cotisations et dons encaissés ce mois-ci."
        >
          {channels.every((c) => c.amount === 0) ? (
            <p className="text-sm text-muted-foreground">
              Pas encore de paiements enregistrés ce mois-ci.
            </p>
          ) : (
            <div className="space-y-5">
              {channels.map((channel) => (
                <div key={channel.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {channel.label}
                    </span>
                    <span className="tabular-nums font-medium text-[var(--ak-emerald-deep)]">
                      {channel.value}% · {formatFcfa(channel.amount)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ak-ivory)]">
                    <div
                      className="h-full rounded-full bg-[var(--ak-emerald-mid)]"
                      style={{ width: `${channel.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </>
  )
}
