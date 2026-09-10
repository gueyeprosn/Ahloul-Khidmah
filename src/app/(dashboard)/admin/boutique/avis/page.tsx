import Link from "next/link"
import { Star } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterChips } from "@/components/shared/filter-chips"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { ReviewModerationActions } from "@/components/store-admin/review-moderation-actions"
import { StoreRatingStars } from "@/components/store/store-rating-stars"
import { prisma } from "@/lib/db"
import { formatDateTime } from "@/lib/format"

export const metadata = { title: "Avis clients — Boutique" }

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
}

export default async function AdminAvisPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const reviews = await prisma.review.findMany({
    where: status ? { status } : undefined,
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const chips = [
    { href: "/admin/boutique/avis", label: "Tous", active: !status },
    { href: "/admin/boutique/avis?status=PENDING", label: "En attente", active: status === "PENDING" },
    { href: "/admin/boutique/avis?status=APPROVED", label: "Approuvés", active: status === "APPROVED" },
    { href: "/admin/boutique/avis?status=REJECTED", label: "Rejetés", active: status === "REJECTED" },
  ]

  return (
    <>
      <PageHeader title="Avis clients" description="Modération — seuls les avis approuvés sont visibles publiquement." />
      <FilterChips chips={chips} />

      <SectionCard flush>
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title="Aucun avis" description="Aucun avis ne correspond à ce filtre." />
        ) : (
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Produit</Th>
                <Th>Client</Th>
                <Th>Note</Th>
                <Th>Commentaire</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th />
              </DataTableHead>
              <DataTableBody>
                {reviews.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <Link href={`/boutique/produits/${r.product.slug}`} className="font-medium text-[var(--ak-emerald-deep)] hover:underline" target="_blank">
                        {r.product.name}
                      </Link>
                    </Td>
                    <Td>
                      {r.customerName}
                      <p className="text-xs text-[var(--ak-ink-soft)]">{r.customerPhone}</p>
                    </Td>
                    <Td><StoreRatingStars rating={r.rating} /></Td>
                    <Td className="max-w-xs text-sm text-[var(--ak-ink-soft)]">{r.comment}</Td>
                    <Td>{formatDateTime(r.createdAt)}</Td>
                    <Td>
                      <StatusBadge
                        label={STATUS_LABEL[r.status] || r.status}
                        variant={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "warning"}
                      />
                    </Td>
                    <Td>
                      <ReviewModerationActions reviewId={r.id} status={r.status} />
                    </Td>
                  </Tr>
                ))}
              </DataTableBody>
            </DataTableRoot>
          </DataTable>
        )}
      </SectionCard>
    </>
  )
}
