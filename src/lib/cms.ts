import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/db"
import { visionSlides } from "@/content/landing"

export type CmsPhoto = {
  id?: string
  src: string
  alt: string
  caption?: string | null
}

export type CmsTestimonial = {
  id?: string
  quoteFr: string
  quoteAr: string
  name: string
  roleFr: string
  roleAr: string
}

async function fetchAlbumPhotos(key: string): Promise<CmsPhoto[]> {
  try {
    const album = await prisma.album.findUnique({
      where: { key },
      include: {
        photos: {
          where: { published: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    })
    if (!album?.published || album.photos.length === 0) return []
    return album.photos.map((p) => ({
      id: p.id,
      src: p.src,
      alt: p.alt,
      caption: p.caption,
    }))
  } catch {
    return []
  }
}

export async function getAlbumPhotos(key: string): Promise<CmsPhoto[]> {
  return unstable_cache(
    () => fetchAlbumPhotos(key),
    ["cms-album", key],
    { revalidate: 60, tags: [`album:${key}`] }
  )()
}

export async function getVisionPhotos(): Promise<CmsPhoto[]> {
  const fromDb = await getAlbumPhotos("vision")
  if (fromDb.length > 0) return fromDb
  return visionSlides.map((s) => ({ src: s.src, alt: s.alt }))
}

export async function getGaleriePhotos(): Promise<CmsPhoto[]> {
  const [galerie, vision] = await Promise.all([
    getAlbumPhotos("galerie"),
    getVisionPhotos(),
  ])
  const seen = new Set<string>()
  const photos: CmsPhoto[] = []
  for (const photo of [...galerie, ...vision]) {
    if (seen.has(photo.src)) continue
    seen.add(photo.src)
    photos.push(photo)
  }
  return photos
}

/** Témoignages bilingues depuis la DB ; tableau vide = fallback i18n côté client. */
export async function getTestimonials(): Promise<CmsTestimonial[]> {
  return unstable_cache(
    async () => {
      try {
        const rows = await prisma.testimonial.findMany({
          where: { published: true },
          orderBy: { sortOrder: "asc" },
        })
        return rows.map((t) => ({
          id: t.id,
          quoteFr: t.quoteFr,
          quoteAr: t.quoteAr,
          name: t.name,
          roleFr: t.roleFr,
          roleAr: t.roleAr,
        }))
      } catch {
        return []
      }
    },
    ["cms-testimonials"],
    { revalidate: 60, tags: ["testimonials"] }
  )()
}

export function slugifyAlbumKey(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
