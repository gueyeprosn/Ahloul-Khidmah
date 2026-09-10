import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { albumUpdateSchema } from "@/features/albums/schema"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
    },
  })
  if (!album) {
    return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
  }
  return NextResponse.json({ album })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = albumUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data: {
    title?: string
    description?: string | null
    published?: boolean
    sortOrder?: number
  } = {}

  if (parsed.data.title !== undefined) data.title = parsed.data.title
  if (body.description !== undefined) {
    data.description = String(body.description || "").trim() || null
  }
  if (parsed.data.published !== undefined) data.published = parsed.data.published
  if (parsed.data.sortOrder !== undefined) data.sortOrder = parsed.data.sortOrder

  try {
    const album = await prisma.album.update({ where: { id }, data })
    return NextResponse.json({ ok: true, album })
  } catch {
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const album = await prisma.album.findUnique({ where: { id } })
  if (!album) {
    return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
  }
  if (album.key === "vision" || album.key === "galerie") {
    return NextResponse.json(
      { error: "Les albums Vision et Galerie ne peuvent pas être supprimés" },
      { status: 400 }
    )
  }

  await prisma.album.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
