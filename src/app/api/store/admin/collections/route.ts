import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { collectionSchema } from "@/features/store/collection-schema"
import { logAudit } from "@/lib/audit-log"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const collections = await prisma.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json({ collections })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = collectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const existing = await prisma.collection.findUnique({ where: { slug: data.slug } })
  if (existing) {
    return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 })
  }

  const collection = await prisma.collection.create({
    data: {
      slug: data.slug,
      name: data.name,
      tagline: data.tagline || null,
      description: data.description,
      type: data.type,
      coverImage: data.coverImage || null,
      bannerImage: data.bannerImage || null,
      accentColor: data.accentColor || null,
      active: data.active ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      sortOrder: data.sortOrder ?? 0,
    },
  })

  await logAudit(session, "store.collection_create", "Collection", collection.id, collection.name)

  return NextResponse.json({ ok: true, collection })
}
