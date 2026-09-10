import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"
import { prisma } from "@/lib/db"

const routes: {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/adhesion", changeFrequency: "weekly", priority: 0.95 },
  { path: "/contribuer", changeFrequency: "weekly", priority: 0.9 },
  { path: "/qui-sommes-nous", changeFrequency: "monthly", priority: 0.9 },
  { path: "/mission", changeFrequency: "monthly", priority: 0.85 },
  { path: "/vision", changeFrequency: "monthly", priority: 0.85 },
  { path: "/mediatheque", changeFrequency: "weekly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
  { path: "/boutique", changeFrequency: "daily", priority: 0.9 },
  { path: "/boutique/collections", changeFrequency: "weekly", priority: 0.75 },
  { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
  { path: "/confidentialite", changeFrequency: "yearly", priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries = routes.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  const [categories, products, collections] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, select: { slug: true } }),
    prisma.product.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.collection.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const categoryEntries = categories.map((c) => ({
    url: `${SITE_URL}/boutique?categorie=${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const productEntries = products.map((p) => ({
    url: `${SITE_URL}/boutique/produits/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const collectionEntries = collections.map((c) => ({
    url: `${SITE_URL}/boutique/collections/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...categoryEntries, ...productEntries, ...collectionEntries]
}
