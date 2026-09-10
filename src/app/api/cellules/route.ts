import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { celluleSchema } from "@/features/cellules/schema"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const cellules = await prisma.cellule.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { adherents: true } } },
  })

  return NextResponse.json({ cellules })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

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
    const cellule = await prisma.cellule.create({
      data: { name, zone },
    })
    return NextResponse.json({ ok: true, cellule })
  } catch {
    return NextResponse.json(
      { error: "Cette cellule existe déjà" },
      { status: 409 }
    )
  }
}
