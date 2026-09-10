import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { slugifyAlbumKey } from "@/lib/cms"
import { albumCreateSchema } from "@/features/albums/schema"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const albums = await prisma.album.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { _count: { select: { photos: true } } },
  })

  return NextResponse.json({ albums })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = albumCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const title = parsed.data.title
  const description = parsed.data.description?.trim() || null
  const key = slugifyAlbumKey(parsed.data.key?.trim() || title)
  if (!key) {
    return NextResponse.json({ error: "Clé d'album invalide" }, { status: 400 })
  }

  try {
    const album = await prisma.album.create({
      data: {
        title,
        key,
        description,
        published: parsed.data.published !== false,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    })
    return NextResponse.json({ ok: true, album })
  } catch {
    return NextResponse.json(
      { error: "Cette clé d'album existe déjà" },
      { status: 409 }
    )
  }
}
