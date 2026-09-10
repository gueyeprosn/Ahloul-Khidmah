import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { celluleSchema } from "@/features/cellules/schema"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = celluleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const name = parsed.data.name
  const zone = parsed.data.zone?.trim() || null

  try {
    const cellule = await prisma.cellule.update({
      where: { id },
      data: { name, zone },
    })
    // keep adherent denormalized fields in sync
    await prisma.adherent.updateMany({
      where: { celluleId: id },
      data: {
        celluleLocale: name,
        ...(zone ? { zoneRegion: zone } : {}),
      },
    })
    return NextResponse.json({ ok: true, cellule })
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
  const count = await prisma.adherent.count({ where: { celluleId: id } })
  if (count > 0) {
    return NextResponse.json(
      { error: "Impossible : des adhérents sont liés à cette cellule" },
      { status: 400 }
    )
  }

  await prisma.cellule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
