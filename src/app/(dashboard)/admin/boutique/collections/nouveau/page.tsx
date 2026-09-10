import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { CollectionForm } from "@/components/store-admin/collection-form"

export const metadata = { title: "Nouvelle collection" }

export default function NouvelleCollectionPage() {
  return (
    <>
      <PageHeader title="Nouvelle collection" description="Créer une collection éditoriale." />
      <SectionCard>
        <CollectionForm mode="create" />
      </SectionCard>
    </>
  )
}
