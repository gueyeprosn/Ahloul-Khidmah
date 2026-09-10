import { PageHeader } from "@/components/shared/page-header"
import { MemberCardActions } from "@/components/adhesion/member-card-actions"
import { SectionCard } from "@/components/shared/section-card"

export const metadata = {
  title: "Aperçu carte membre",
  robots: { index: false, follow: false },
}

export default function CartePreviewPage() {
  return (
    <>
      <PageHeader
        title="Aperçu carte membre"
        description="Design premium badge — ivoire, émeraude, or. Exemple de rendu."
      />
      <SectionCard title="Prévisualisation">
        <div className="mx-auto max-w-md py-4">
          <MemberCardActions
            member={{
              id: "AK-20260806-PREVIEW",
              prenoms: "Amadou Bamba",
              nom: "Diop",
              celluleLocale: "Touba Centre",
              tel: "771234567",
              whatsapp: "771234567",
            }}
          />
        </div>
      </SectionCard>
    </>
  )
}
