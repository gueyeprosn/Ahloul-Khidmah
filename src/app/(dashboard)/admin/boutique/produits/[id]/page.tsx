import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { SectionCard } from "@/components/shared/section-card"
import { ProductForm } from "@/components/store-admin/product-form"
import { ProductImagesManager } from "@/components/store-admin/product-images-manager"
import { ProductVariantsManager } from "@/components/store-admin/product-variants-manager"
import { ArchiveProductButton } from "@/components/store-admin/archive-product-button"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } })
  return { title: product?.name || "Produit" }
}

export default async function ProduitDetailPage({ params }: Params) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ])
  if (!product) notFound()

  return (
    <>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        actions={<ArchiveProductButton productId={product.id} active={product.active} />}
      />

      <SectionCard title="Informations">
        <ProductForm
          mode="edit"
          productId={product.id}
          categories={categories}
          initial={{
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            categoryId: product.categoryId,
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold,
            limitedEdition: product.limitedEdition,
            limitedTotal: product.limitedTotal,
            preorder: product.preorder,
            active: product.active,
            featured: product.featured,
            isNew: product.isNew,
          }}
        />
      </SectionCard>

      <SectionCard title="Images">
        <ProductImagesManager productId={product.id} images={product.images} />
      </SectionCard>

      <SectionCard
        title="Variantes"
        description="Tailles, couleurs… chaque variante a son propre stock et peut avoir un prix différent."
      >
        <ProductVariantsManager productId={product.id} variants={product.variants} />
      </SectionCard>
    </>
  )
}
