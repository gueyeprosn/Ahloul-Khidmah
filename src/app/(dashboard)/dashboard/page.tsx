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
  Gauge,
  Receipt,
  BellRing,
  ArrowRightLeft,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { AlertBanner } from "@/components/shared/alert-banner"
import { SectionCard } from "@/components/shared/section-card"
import { MonthlyBars } from "@/components/shared/monthly-bars"
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
import { getPilotageStats } from "@/lib/dashboard-stats"
import { campagneLabel } from "@/features/contributions/schema"

function currentPeriode() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

const HISTORY_MONTHS = 6

// Montant sans devise (l'unité est donnée dans la description du tableau),
// espaces normales pour que la colonne puisse se resserrer.
function formatNombre(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n).replace(/[\u00a0\u202f]/g, " ")
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

// Variation en % vs la même période du mois précédent (le mois en cours est
// incomplet : le comparer à un mois entier donnerait une baisse artificielle) ;
// `undefined` quand la comparaison n'a pas de sens (base à zéro) ou quand rien
// n'a bougé.
function trendVs(current: number, previous: number) {
  if (previous <= 0 || current === previous) return undefined
  const pct = Math.round(((current - previous) / previous) * 100)
  return {
    value: `${pct > 0 ? "+" : ""}${pct}% vs même période le mois dernier`,
    direction: pct > 0 ? ("up" as const) : ("down" as const),
  }
}

export default async function DashboardPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const historyStart = new Date(
    now.getFullYear(),
    now.getMonth() - (HISTORY_MONTHS - 1),
    1
  )
  // Même position dans le mois précédent (ex. le 29 → le 29), bornée au 1er du
  // mois courant pour les mois plus courts.
  const prevCutoff = new Date(
    Math.min(
      prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()),
      monthStart.getTime()
    )
  )
  const periode = currentPeriode()
  const pilotagePromise = getPilotageStats(now, HISTORY_MONTHS)

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
    nouvellesMoisPrecedent,
    historiqueCotisations,
    historiqueDons,
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
    prisma.adherent.count({
      where: { createdAt: { gte: prevMonthStart, lt: prevCutoff } },
    }),
    prisma.cotisation.findMany({
      where: { statut: "paye", paidAt: { gte: historyStart } },
      select: { montant: true, paidAt: true },
    }),
    prisma.contribution.findMany({
      where: { status: "completed", updatedAt: { gte: historyStart } },
      select: { amount: true, updatedAt: true },
    }),
  ])

  const history = Array.from({ length: HISTORY_MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (HISTORY_MONTHS - 1 - i), 1)
    return {
      key: monthKey(d),
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
      cotisations: 0,
      dons: 0,
      current: i === HISTORY_MONTHS - 1,
    }
  })
  const historyByKey = new Map(history.map((h) => [h.key, h]))
  for (const c of historiqueCotisations) {
    if (c.paidAt) {
      const bucket = historyByKey.get(monthKey(c.paidAt))
      if (bucket) bucket.cotisations += c.montant
    }
  }
  for (const d of historiqueDons) {
    const bucket = historyByKey.get(monthKey(d.updatedAt))
    if (bucket) bucket.dons += d.amount
  }
  const pilotage = await pilotagePromise
  const tableauMensuel = history
    .map((h, i) => {
      const total = h.cotisations + h.dons
      const prev = i > 0 ? history[i - 1].cotisations + history[i - 1].dons : 0
      return {
        ...h,
        total,
        adhesions: pilotage.adhesionsParMois[i],
        // Le mois en cours est incomplet : pas de variation comparable.
        variation:
          prev > 0 && !h.current
            ? Math.round(((total - prev) / prev) * 100)
            : undefined,
      }
    })
    .reverse()
  const collectéPrecedent =
    historiqueCotisations.reduce(
      (s, c) =>
        c.paidAt && c.paidAt >= prevMonthStart && c.paidAt < prevCutoff
          ? s + c.montant
          : s,
      0
    ) +
    historiqueDons.reduce(
      (s, d) =>
        d.updatedAt >= prevMonthStart && d.updatedAt < prevCutoff
          ? s + d.amount
          : s,
      0
    )

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
          trend={trendVs(collecté, collectéPrecedent)}
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
          trend={trendVs(nouvellesMois, nouvellesMoisPrecedent)}
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

      <SectionCard
        title="Évolution des encaissements"
        description={`Cotisations et dons encaissés sur les ${HISTORY_MONTHS} derniers mois.`}
      >
        <MonthlyBars data={history} />
      </SectionCard>

      <h2 className="text-sm font-semibold text-[var(--ak-ink-soft)]">
        Pilotage financier · {periode}
      </h2>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Taux de recouvrement"
          value={`${pilotage.tauxRecouvrement}%`}
          description={`${formatFcfa(pilotage.encaisseePeriode)} sur ${formatFcfa(pilotage.attendu)} attendus`}
          icon={Gauge}
        />
        <KpiCard
          title="Reste à recouvrer"
          value={formatFcfa(pilotage.resteARecouvrer)}
          description={`${pilotage.impayes}/${pilotage.nbCotisants} membres n'ont pas cotisé`}
          icon={BellRing}
        />
        <KpiCard
          title="Cotisation moyenne"
          value={formatFcfa(pilotage.cotisationMoyenne)}
          description="par membre à jour ce mois"
          icon={Receipt}
        />
        <KpiCard
          title="Conversion des paiements"
          value={pilotage.paiements.initiés > 0 ? `${pilotage.paiements.tauxConversion}%` : "—"}
          description={`${pilotage.paiements.reussis} réussis / ${pilotage.paiements.initiés} lancés (30 j)`}
          icon={ArrowRightLeft}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <SectionCard
          className="lg:col-span-3"
          title="Tableau mensuel"
          description="Encaissements en F CFA et adhésions, mois par mois."
          flush
        >
          <DataTable className="rounded-none border-0">
            <DataTableRoot>
              <DataTableHead>
                <Th>Mois</Th>
                <Th className="text-right">Cotisations</Th>
                <Th className="text-right">Dons</Th>
                <Th className="text-right">Total</Th>
                <Th className="hidden text-right sm:table-cell">Variation</Th>
                <Th className="hidden text-right md:table-cell">Adhésions</Th>
              </DataTableHead>
              <DataTableBody>
                {tableauMensuel.map((row) => (
                  <Tr key={row.key}>
                    <Td className="font-medium whitespace-nowrap">
                      <span className="capitalize">{row.label}</span>
                      {row.current ? (
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}
                          (en cours)
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">
                      {formatNombre(row.cotisations)}
                    </Td>
                    <Td className="text-right whitespace-nowrap tabular-nums">
                      {formatNombre(row.dons)}
                    </Td>
                    <Td className="text-right font-medium whitespace-nowrap tabular-nums text-[var(--ak-emerald-deep)]">
                      {formatNombre(row.total)}
                    </Td>
                    <Td className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                      {row.variation === undefined
                        ? "—"
                        : `${row.variation > 0 ? "+" : ""}${row.variation}%`}
                    </Td>
                    <Td className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                      {row.adhesions}
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
        </SectionCard>

        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title="Membres à relancer"
            description="Cotisation mensuelle attendue, non reçue."
          >
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Impayés ce mois</dt>
                <dd className="tabular-nums font-medium text-[var(--ak-emerald-deep)]">
                  {pilotage.impayes} · {formatFcfa(pilotage.montantImpayes)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">En retard de 2 mois et +</dt>
                <dd className="tabular-nums font-medium text-[var(--ak-emerald-deep)]">
                  {pilotage.retard2} · {formatFcfa(pilotage.montantRetard2)}
                </dd>
              </div>
            </dl>
            <Button variant="ghost" size="sm" className="mt-3 -ml-2" asChild>
              <Link href="/cotisations">
                Ouvrir les cotisations
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </SectionCard>

          <SectionCard
            title="Répartition géographique"
            description="Membres actifs : Sénégal et diaspora."
          >
            {pilotage.totalActifs === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun membre actif pour l&apos;instant.
              </p>
            ) : (
              <div className="space-y-4">
                {(
                  [
                    ["Sénégal", pilotage.geo.senegal],
                    ["Diaspora", pilotage.geo.diaspora],
                    ["Zone non renseignée ou illisible", pilotage.geo.inconnu],
                  ] as const
                ).map(([label, count]) => {
                  const pct = Math.round((count / pilotage.totalActifs) * 100)
                  return (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="tabular-nums font-medium text-[var(--ak-emerald-deep)]">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ak-ivory)]">
                        <div
                          className="h-full rounded-full bg-[var(--ak-emerald-mid)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {pilotage.celluleAPreciser > 0 ? (
                  <p className="text-xs text-pretty text-[var(--ak-ink-soft)]">
                    {pilotage.celluleAPreciser} membre
                    {pilotage.celluleAPreciser > 1 ? "s" : ""} sans cellule
                    précisée : le suivi par cellule reste incomplet.
                  </p>
                ) : null}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Dons par campagne"
            description={
              pilotage.boutique.commandes > 0
                ? `Boutique ce mois : ${formatFcfa(pilotage.boutique.ca)} (${pilotage.boutique.commandes} commande${pilotage.boutique.commandes > 1 ? "s" : ""}).`
                : "Cumul depuis le début, dons confirmés."
            }
          >
            {pilotage.campagnes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun don confirmé pour l&apos;instant.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {pilotage.campagnes.map((c) => (
                  <li
                    key={c.campagne}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-muted-foreground">
                      {campagneLabel(c.campagne)}{" "}
                      <span className="text-xs">({c.nombre})</span>
                    </span>
                    <span className="tabular-nums font-medium text-[var(--ak-emerald-deep)]">
                      {formatFcfa(c.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
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
                        <Td className="whitespace-nowrap tabular-nums">{formatFcfa(amount)}</Td>
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
