import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { CollectionForm } from "@/components/store-admin/collection-form"
import { ToggleCollectionButton } from "@/components/store-admin/toggle-collection-button"
import { CollectionProductsManager } from "@/components/store-admin/collection-products-manager"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

function toLocalInput(date: Date | null) {
  if (!date) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const collection = await prisma.collection.findUnique({ where: { id }, select: { name: true } })
  return { title: collection?.name || "Collection" }
}

export default async function CollectionDetailPage({ params }: Params) {
  const { id } = await params
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: { product: { select: { id: true, name: true, slug: true, price: true } } },
      },
    },
  })
  if (!collection) notFound()

  return (
    <>
      <PageHeader
        title={collection.name}
        description={`${collection.products.length} produit${collection.products.length > 1 ? "s" : ""}`}
        actions={<ToggleCollectionButton collectionId={collection.id} active={collection.active} />}
      />

      <SectionCard title="Informations">
        <CollectionForm
          mode="edit"
          collectionId={collection.id}
          initial={{
            slug: collection.slug,
            name: collection.name,
            tagline: collection.tagline || "",
            description: collection.description,
            type: collection.type as
              | "PERMANENTE"
              | "SAISONNIERE"
              | "EVENEMENTIELLE"
              | "LIMITEE"
              | "MEMBRE"
              | "SOLIDAIRE",
            coverImage: collection.coverImage || "",
            bannerImage: collection.bannerImage || "",
            accentColor: collection.accentColor || "",
            active: collection.active,
            startsAt: toLocalInput(collection.startsAt),
            endsAt: toLocalInput(collection.endsAt),
            sortOrder: collection.sortOrder,
          }}
        />
      </SectionCard>

      <SectionCard title="Produits">
        <CollectionProductsManager
          collectionId={collection.id}
          products={collection.products.map((pc) => ({
            id: pc.product.id,
            name: pc.product.name,
            slug: pc.product.slug,
            price: pc.product.price,
          }))}
        />
      </SectionCard>
    </>
  )
}
