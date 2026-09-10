import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logAudit } from "@/lib/audit-log"

type Params = { params: Promise<{ id: string }> }

const bodySchema = z.object({
  productId: z.string().trim().min(1),
})

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection) {
    return NextResponse.json({ error: "Collection introuvable" }, { status: 404 })
  }

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } })
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }

  const existing = await prisma.productCollection.findUnique({
    where: { productId_collectionId: { productId: product.id, collectionId: id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Ce produit fait déjà partie de la collection" }, { status: 409 })
  }

  const count = await prisma.productCollection.count({ where: { collectionId: id } })
  const link = await prisma.productCollection.create({
    data: { productId: product.id, collectionId: id, sortOrder: count },
  })

  await logAudit(
    session,
    "store.collection_product_add",
    "Collection",
    id,
    `${product.name} ajouté à ${collection.name}`
  )

  return NextResponse.json({ ok: true, link })
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  if (!productId) {
    return NextResponse.json({ error: "productId requis" }, { status: 400 })
  }

  const link = await prisma.productCollection.findUnique({
    where: { productId_collectionId: { productId, collectionId: id } },
    include: { product: true, collection: true },
  })
  if (!link) {
    return NextResponse.json({ error: "Association introuvable" }, { status: 404 })
  }

  await prisma.productCollection.delete({
    where: { productId_collectionId: { productId, collectionId: id } },
  })

  await logAudit(
    session,
    "store.collection_product_remove",
    "Collection",
    id,
    `${link.product.name} retiré de ${link.collection.name}`
  )

  return NextResponse.json({ ok: true })
}
