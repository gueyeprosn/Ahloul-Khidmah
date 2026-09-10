import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { ProductForm } from "@/components/store-admin/product-form"
import { prisma } from "@/lib/db"

export const metadata = { title: "Nouveau produit" }

export default async function NouveauProduitPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } })

  return (
    <>
      <PageHeader title="Nouveau produit" description="Créer un produit de la boutique." />
      <SectionCard>
        <ProductForm mode="create" categories={categories} />
      </SectionCard>
    </>
  )
}
