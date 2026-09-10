import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { AlertBanner } from "@/components/shared/alert-banner"
import { SectionCard } from "@/components/shared/section-card"
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
import { prisma } from "@/lib/db"
import {
  canalLabel,
  parseMontantFcfa,
  statusLabel,
} from "@/lib/adherents"
import { formatDate, formatFcfa } from "@/lib/format"
import { UpdateStatusButtons } from "@/components/adherents/update-status-buttons"
import { MemberCardPanel } from "@/components/adherents/member-card-panel"
import { AdminEditProfileForm } from "@/components/adherents/admin-edit-profile-form"
import { SendPayLinkButton } from "@/components/adherents/send-pay-link-button"
import { ResetPinButton } from "@/components/adherents/reset-pin-button"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return { title: `Adhérent ${id}` }
}

export default async function AdherentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const adherent = await prisma.adherent.findUnique({
    where: { id },
    include: {
      cotisations: { orderBy: { periode: "desc" }, take: 12 },
      payments: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  })
  if (!adherent) notFound()

  const label = statusLabel(adherent.status)
  const amount = parseMontantFcfa(adherent.montant, adherent.montantAutre)
  const completeUrl = `/adhesion/completer?id=${encodeURIComponent(adherent.id)}&tel=${encodeURIComponent(adherent.tel)}`
  const adhesionPayment = adherent.payments.find((p) => p.type === "adhesion")

  return (
    <>
      <PageHeader
        title={`${adherent.prenoms} ${adherent.nom}`}
        description={adherent.id}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/adherents">
              <ArrowLeft className="size-3.5" />
              Retour
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
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
        <StatusBadge
          label={adherent.ficheComplete ? "Fiche complète" : "Fiche incomplète"}
          variant={adherent.ficheComplete ? "success" : "warning"}
        />
        <StatusBadge
          label={
            adherent.badgeSentAt
              ? `Badge WhatsApp envoyé`
              : "Badge non envoyé"
          }
          variant={adherent.badgeSentAt ? "success" : "neutral"}
        />
        <StatusBadge
          label={adherent.pinHash ? "PIN défini" : "PIN non défini"}
          variant={adherent.pinHash ? "success" : "warning"}
        />
        <UpdateStatusButtons id={adherent.id} current={adherent.status} />
        <SendPayLinkButton adherentId={adherent.id} tel={adherent.tel} />
        <ResetPinButton adherentId={adherent.id} hasPin={Boolean(adherent.pinHash)} />
      </div>

      {!adherent.ficheComplete ? (
        <AlertBanner
          variant="warning"
          title="Dossier membre incomplet"
          description="Corrigez ou complétez la fiche ci-dessous, ou envoyez le lien public à l'adhérent."
          href={completeUrl}
          linkLabel="Lien public de complétion"
        />
      ) : null}

      {adherent.status === "en_attente" && !adhesionPayment ? (
        <AlertBanner
          variant="info"
          title="Paiement d'adhésion en attente"
          description="L'adhérent n'a pas encore payé en ligne. Utilisez « Lien paiement WhatsApp » ou enregistrez un paiement manuel depuis Cotisations."
        />
      ) : null}

      <AdminEditProfileForm
        adherent={{
          id: adherent.id,
          nom: adherent.nom,
          prenoms: adherent.prenoms,
          tel: adherent.tel,
          whatsapp: adherent.whatsapp,
          email: adherent.email,
          profession: adherent.profession,
          autreProfession: adherent.autreProfession,
          celluleLocale: adherent.celluleLocale,
          zoneRegion: adherent.zoneRegion,
          montant: adherent.montant,
          montantAutre: adherent.montantAutre,
        }}
      />

      <MemberCardPanel
        badgeSentAt={adherent.badgeSentAt}
        badgeEmailSentAt={adherent.badgeEmailSentAt}
        hasEmail={Boolean(adherent.email?.trim())}
        member={{
          id: adherent.id,
          prenoms: adherent.prenoms,
          nom: adherent.nom,
          celluleLocale: adherent.celluleLocale,
          zoneRegion: adherent.zoneRegion,
          tel: adherent.tel,
          whatsapp: adherent.whatsapp,
          memberNumber: adherent.memberNumber,
          photoUrl: adherent.photoUrl,
        }}
      />

      <SectionCard title="Récapitulatif">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Canal" value={canalLabel(adherent.canal)} />
          <Field label="Inscrit le" value={formatDate(adherent.createdAt)} />
          <Field label="Montant" value={formatFcfa(amount)} />
          <Field label="Pays / Région" value={adherent.zoneRegion} />
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Historique cotisations"
          description="12 dernières périodes"
          flush
        >
          {adherent.cotisations.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              Aucune cotisation enregistrée.
            </p>
          ) : (
            <DataTable className="rounded-none border-0">
              <DataTableRoot>
                <DataTableHead>
                  <Th>Période</Th>
                  <Th>Montant</Th>
                  <Th>Canal</Th>
                  <Th>Statut</Th>
                </DataTableHead>
                <DataTableBody>
                  {adherent.cotisations.map((c) => (
                    <Tr key={c.id}>
                      <Td className="tabular-nums">{c.periode}</Td>
                      <Td className="tabular-nums">
                        {formatFcfa(c.montant)}
                      </Td>
                      <Td>{canalLabel(c.canal)}</Td>
                      <Td>
                        <StatusBadge
                          label={c.statut === "paye" ? "Payé" : c.statut}
                          variant={
                            c.statut === "paye" ? "success" : "warning"
                          }
                        />
                      </Td>
                    </Tr>
                  ))}
                </DataTableBody>
              </DataTableRoot>
            </DataTable>
          )}
        </SectionCard>

        <SectionCard
          title="Paiements"
          description="Transactions en ligne et manuelles"
          flush
        >
          {adherent.payments.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              Aucun paiement enregistré.
            </p>
          ) : (
            <DataTable className="rounded-none border-0">
              <DataTableRoot>
                <DataTableHead>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Montant</Th>
                  <Th>Statut</Th>
                </DataTableHead>
                <DataTableBody>
                  {adherent.payments.map((p) => (
                    <Tr key={p.id}>
                      <Td className="whitespace-nowrap">
                        {formatDate(p.createdAt)}
                      </Td>
                      <Td>{p.type}</Td>
                      <Td className="tabular-nums">
                        {formatFcfa(p.amount)}
                      </Td>
                      <Td>
                        <StatusBadge
                          label={p.status}
                          variant={
                            p.status === "completed"
                              ? "success"
                              : p.status === "pending"
                                ? "warning"
                                : "danger"
                          }
                        />
                      </Td>
                    </Tr>
                  ))}
                </DataTableBody>
              </DataTableRoot>
            </DataTable>
          )}
        </SectionCard>
      </div>
    </>
  )
}

function Field({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <div className="text-xs text-[var(--ak-ink-soft)]">{label}</div>
      <div className="mt-0.5 font-medium text-[var(--ak-emerald-deep)]">
        {value}
      </div>
    </div>
  )
}
