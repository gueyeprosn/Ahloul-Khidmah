import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { CouponForm } from "@/components/store-admin/coupon-form"
import { ToggleCouponButton } from "@/components/store-admin/toggle-coupon-button"
import {
  DataTable,
  DataTableRoot,
  DataTableHead,
  DataTableBody,
  Th,
  Tr,
  Td,
} from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { History } from "lucide-react"
import { prisma } from "@/lib/db"
import { formatDateTime, formatFcfa } from "@/lib/format"

type Params = { params: Promise<{ id: string }> }

function toLocalInput(date: Date | null) {
  if (!date) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const coupon = await prisma.coupon.findUnique({ where: { id }, select: { code: true } })
  return { title: coupon?.code || "Coupon" }
}

export default async function CouponDetailPage({ params }: Params) {
  const { id } = await params
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: { usages: { orderBy: { createdAt: "desc" }, take: 20 } },
  })
  if (!coupon) notFound()

  return (
    <>
      <PageHeader
        title={coupon.code}
        description={`${coupon.usages.length} utilisation${coupon.usages.length > 1 ? "s" : ""} récente${coupon.usages.length > 1 ? "s" : ""}`}
        actions={<ToggleCouponButton couponId={coupon.id} active={coupon.active} />}
      />

      <SectionCard title="Informations">
        <CouponForm
          mode="edit"
          couponId={coupon.id}
          initial={{
            code: coupon.code,
            type: coupon.type as "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING",
            value: coupon.value,
            startsAt: toLocalInput(coupon.startsAt),
            endsAt: toLocalInput(coupon.endsAt),
            minOrderAmount: coupon.minOrderAmount,
            maxUses: coupon.maxUses,
            usesPerCustomer: coupon.usesPerCustomer,
            active: coupon.active,
            membersOnly: coupon.membersOnly,
          }}
        />
      </SectionCard>

      <SectionCard title="Utilisations" flush>
        {coupon.usages.length === 0 ? (
          <EmptyState icon={History} title="Aucune utilisation" description="Ce coupon n'a pas encore été utilisé." />
        ) : (
          <DataTable>
            <DataTableRoot>
              <DataTableHead>
                <Th>Date</Th>
                <Th>Téléphone</Th>
                <Th>Réduction</Th>
              </DataTableHead>
              <DataTableBody>
                {coupon.usages.map((u) => (
                  <Tr key={u.id}>
                    <Td>{formatDateTime(u.createdAt)}</Td>
                    <Td>{u.customerPhone}</Td>
                    <Td>{formatFcfa(u.discountAmount)}</Td>
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
