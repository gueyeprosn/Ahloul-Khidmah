import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { photoCreateSchema } from "@/features/photos/schema"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = photoCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "albumId et src requis", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const albumId = parsed.data.albumId
  const src = parsed.data.src
  const alt = parsed.data.alt?.trim() || "Photo"
  const caption = parsed.data.caption?.trim() || null

  const album = await prisma.album.findUnique({ where: { id: albumId } })
  if (!album) {
    return NextResponse.json({ error: "Album introuvable" }, { status: 404 })
  }

  const max = await prisma.photo.aggregate({
    where: { albumId },
    _max: { sortOrder: true },
  })

  const photo = await prisma.photo.create({
    data: {
      albumId,
      src,
      alt,
      caption,
      published: parsed.data.published !== false,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json({ ok: true, photo })
}
