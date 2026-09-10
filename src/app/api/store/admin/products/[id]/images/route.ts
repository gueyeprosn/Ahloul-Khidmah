import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

const bodySchema = z.object({
  // Toujours produit par /api/medias/upload — jamais une URL externe arbitraire
  // (évite qu'un compte admin compromis ne pointe une image vers un hôte tiers).
  url: z.string().trim().regex(/^\/uploads\/[A-Za-z0-9._-]+$/, "URL invalide").max(300),
  alt: z.string().trim().min(1).max(200),
})

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const count = await prisma.productImage.count({ where: { productId: id } })
  const image = await prisma.productImage.create({
    data: { productId: id, url: parsed.data.url, alt: parsed.data.alt, sortOrder: count },
  })

  return NextResponse.json({ ok: true, image })
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const imageId = searchParams.get("imageId")
  if (!imageId) {
    return NextResponse.json({ error: "imageId requis" }, { status: 400 })
  }
  const image = await prisma.productImage.findUnique({ where: { id: imageId } })
  if (!image || image.productId !== id) {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 })
  }
  await prisma.productImage.delete({ where: { id: imageId } })
  return NextResponse.json({ ok: true })
}
