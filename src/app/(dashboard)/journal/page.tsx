import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusBadge } from "@/components/shared/status-badge"
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
import Link from "next/link"
import { History } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import { prisma } from "@/lib/db"

export const metadata = { title: "Journal d'activité" }

const ACTION_LABELS: Record<string, string> = {
  "admin.create": "Création compte admin",
  "admin.activate": "Activation compte admin",
  "admin.deactivate": "Désactivation compte admin",
  "cotisation.record": "Cotisation enregistrée",
  "cotisation.update": "Cotisation modifiée/annulée",
  "contribution.status_change": "Statut de don modifié",
  "parametres.update": "Profil modifié",
  "payment.reconcile_as_don": "Paiement bloqué réconcilié en don",
}

const PAGE_SIZE = 50

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageRaw = "1" } = await searchParams
  const page = Math.max(1, Number(pageRaw) || 1)

  const [total, entries] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageHeader
        title="Journal d'activité"
        description="Historique des actions sensibles effectuées par les administrateurs (comptes admin, cotisations, dons, profil)."
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="Aucune activité enregistrée"
          description="Les actions sensibles (création d'admin, cotisations, dons) apparaîtront ici au fur et à mesure."
        />
      ) : (
        <>
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Date</Th>
                <Th>Administrateur</Th>
                <Th>Action</Th>
                <Th>Détail</Th>
              </DataTableHead>
              <DataTableBody>
                {entries.map((e) => (
                  <Tr key={e.id}>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(e.createdAt)}
                    </Td>
                    <Td className="font-medium text-[var(--ak-emerald-deep)]">
                      {e.adminName}
                    </Td>
                    <Td>
                      <StatusBadge
                        label={ACTION_LABELS[e.action] || e.action}
                        variant="neutral"
                      />
                    </Td>
                    <Td className="text-muted-foreground">
                      {e.details || "—"}
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
          {pageCount > 1 ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">
                Page {page} / {pageCount} · {total} entrée{total > 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/journal?page=${page - 1}`}>Précédent</Link>
                  </Button>
                ) : null}
                {page < pageCount ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/journal?page=${page + 1}`}>Suivant</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  )
}
