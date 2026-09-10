import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { collectionUpdateSchema } from "@/features/store/collection-schema"
import { logAudit } from "@/lib/audit-log"
import { catalogInclude } from "@/lib/store/catalog"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: { product: { include: catalogInclude } },
      },
    },
  })
  if (!collection) {
    return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
  }
  return NextResponse.json({ collection })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params

  const body = await request.json()
  const parsed = collectionUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const existing = await prisma.collection.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
  }

  if (data.slug && data.slug !== existing.slug) {
    const dup = await prisma.collection.findUnique({ where: { slug: data.slug } })
    if (dup) return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 })
  }

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.tagline !== undefined && { tagline: data.tagline || null }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage || null }),
      ...(data.bannerImage !== undefined && { bannerImage: data.bannerImage || null }),
      ...(data.accentColor !== undefined && { accentColor: data.accentColor || null }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  })

  await logAudit(session, "store.collection_update", "Collection", id, collection.name)

  return NextResponse.json({ ok: true, collection })
}

/** Active/désactive — jamais de suppression physique (garde l'historique des associations produits). */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const existing = await prisma.collection.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
  }
  const collection = await prisma.collection.update({
    where: { id },
    data: { active: !existing.active },
  })
  await logAudit(
    session,
    "store.collection_toggle",
    "Collection",
    id,
    `${collection.active ? "activée" : "désactivée"} — ${collection.name}`
  )
  return NextResponse.json({ ok: true, collection })
}
