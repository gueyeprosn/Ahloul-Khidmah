import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { CouponForm } from "@/components/store-admin/coupon-form"

export const metadata = { title: "Nouveau coupon" }

export default function NouveauCouponPage() {
  return (
    <>
      <PageHeader title="Nouveau coupon" description="Créer un code de réduction." />
      <SectionCard>
        <CouponForm mode="create" />
      </SectionCard>
    </>
  )
}
