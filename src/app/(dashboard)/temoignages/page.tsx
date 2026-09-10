import { PageHeader } from "@/components/shared/page-header"
import { prisma } from "@/lib/db"
import { TestimonialsManager } from "@/components/cms/testimonials-manager"

export const metadata = { title: "Témoignages" }

export default async function TemoignagesPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return (
    <>
      <PageHeader
        title="Témoignages"
        description="Citations affichées sur le site public (FR / AR)."
      />
      <TestimonialsManager
        initial={testimonials.map((t) => ({
          id: t.id,
          quoteFr: t.quoteFr,
          quoteAr: t.quoteAr,
          name: t.name,
          roleFr: t.roleFr,
          roleAr: t.roleAr,
          published: t.published,
          sortOrder: t.sortOrder,
        }))}
      />
    </>
  )
}
