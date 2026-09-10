import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { temoignageMoveSchema, temoignageUpdateSchema } from "@/features/temoignages/schema"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const moveParsed = temoignageMoveSchema.safeParse(body)

  if (moveParsed.success) {
    const { dir } = moveParsed.data
    const row = await prisma.testimonial.findUnique({ where: { id } })
    if (!row) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 })
    }
    const siblings = await prisma.testimonial.findMany({
      orderBy: { sortOrder: "asc" },
    })
    const idx = siblings.findIndex((t) => t.id === id)
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) {
      return NextResponse.json({ ok: true })
    }
    const other = siblings[swapIdx]
    await prisma.$transaction([
      prisma.testimonial.update({
        where: { id: row.id },
        data: { sortOrder: other.sortOrder },
      }),
      prisma.testimonial.update({
        where: { id: other.id },
        data: { sortOrder: row.sortOrder },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  const updateParsed = temoignageUpdateSchema.safeParse(body)
  if (!updateParsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: updateParsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data: {
    quoteFr?: string
    quoteAr?: string
    name?: string
    roleFr?: string
    roleAr?: string
    published?: boolean
    sortOrder?: number
  } = {}

  if (updateParsed.data.quoteFr !== undefined) data.quoteFr = updateParsed.data.quoteFr
  if (updateParsed.data.quoteAr !== undefined) data.quoteAr = updateParsed.data.quoteAr
  if (updateParsed.data.name !== undefined) data.name = updateParsed.data.name
  if (updateParsed.data.roleFr !== undefined) data.roleFr = updateParsed.data.roleFr
  if (updateParsed.data.roleAr !== undefined) data.roleAr = updateParsed.data.roleAr
  if (updateParsed.data.published !== undefined) data.published = updateParsed.data.published
  if (updateParsed.data.sortOrder !== undefined) data.sortOrder = updateParsed.data.sortOrder

  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data,
    })
    return NextResponse.json({ ok: true, testimonial })
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
    await prisma.testimonial.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Suppression impossible" }, { status: 400 })
  }
}
