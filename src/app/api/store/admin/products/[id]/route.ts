import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { productSchema } from "@/features/store/product-schema"
import { logAudit } from "@/lib/audit-log"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, category: true },
  })
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }
  return NextResponse.json({ product })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params

  const body = await request.json()
  const parsed = productSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }

  if (data.slug && data.slug !== existing.slug) {
    const dup = await prisma.product.findUnique({ where: { slug: data.slug } })
    if (dup) return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 })
  }
  if (data.sku && data.sku !== existing.sku) {
    const dup = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (dup) return NextResponse.json({ error: "Ce SKU existe déjà" }, { status: 409 })
  }

  const stockDelta =
    typeof data.stock === "number" && data.stock !== existing.stock
      ? data.stock - existing.stock
      : 0

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
      ...(data.limitedEdition !== undefined && { limitedEdition: data.limitedEdition }),
      ...(data.limitedTotal !== undefined && { limitedTotal: data.limitedTotal }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.isNew !== undefined && { isNew: data.isNew }),
    },
  })

  if (stockDelta !== 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: id,
        type: "ADJUSTMENT",
        quantity: stockDelta,
        reason: "Ajustement via fiche produit",
        adminId: session.id,
      },
    })
  }

  await logAudit(session, "store.product_update", "Product", id, product.name)

  return NextResponse.json({ ok: true, product })
}

/** Archive (pas de suppression physique — un produit déjà commandé doit rester lisible dans l'historique). */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
  }
  const product = await prisma.product.update({
    where: { id },
    data: { active: !existing.active },
  })
  await logAudit(
    session,
    "store.product_archive",
    "Product",
    id,
    `${product.active ? "réactivé" : "archivé"} — ${product.name}`
  )
  return NextResponse.json({ ok: true, product })
}
