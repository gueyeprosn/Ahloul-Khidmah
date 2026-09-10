import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { photoMoveSchema, photoUpdateSchema } from "@/features/photos/schema"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const moveParsed = photoMoveSchema.safeParse(body)

  if (moveParsed.success) {
    const { dir } = moveParsed.data
    const photo = await prisma.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ error: "Photo introuvable" }, { status: 404 })
    }
    const siblings = await prisma.photo.findMany({
      where: { albumId: photo.albumId },
      orderBy: { sortOrder: "asc" },
    })
    const idx = siblings.findIndex((p) => p.id === id)
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) {
      return NextResponse.json({ ok: true })
    }
    const other = siblings[swapIdx]
    await prisma.$transaction([
      prisma.photo.update({
        where: { id: photo.id },
        data: { sortOrder: other.sortOrder },
      }),
      prisma.photo.update({
        where: { id: other.id },
        data: { sortOrder: photo.sortOrder },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  const updateParsed = photoUpdateSchema.safeParse(body)
  if (!updateParsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: updateParsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data: {
    alt?: string
    caption?: string | null
    published?: boolean
    sortOrder?: number
  } = {}
  if (updateParsed.data.alt !== undefined) data.alt = updateParsed.data.alt.trim() || "Photo"
  if (updateParsed.data.caption !== undefined) {
    data.caption = updateParsed.data.caption.trim() || null
  }
  if (updateParsed.data.published !== undefined) data.published = updateParsed.data.published
  if (updateParsed.data.sortOrder !== undefined) data.sortOrder = updateParsed.data.sortOrder

  try {
    const photo = await prisma.photo.update({ where: { id }, data })
    return NextResponse.json({ ok: true, photo })
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
  try {
    await prisma.photo.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Suppression impossible" }, { status: 400 })
  }
}
