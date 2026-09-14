import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { productSchema } from "@/features/store/product-schema"
import { logAudit } from "@/lib/audit-log"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const products = await prisma.product.findMany({
    include: {
      category: { select: { name: true, slug: true } },
      variants: true,
      _count: { select: { orderItems: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } })
  if (existingSlug) {
    return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 })
  }
  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } })
  if (existingSku) {
    return NextResponse.json({ error: "Ce SKU existe déjà" }, { status: 409 })
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      description: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      categoryId: data.categoryId || null,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold,
      limitedEdition: data.limitedEdition ?? false,
      limitedTotal: data.limitedTotal ?? null,
      preorder: data.preorder ?? false,
      active: data.active ?? true,
      featured: data.featured ?? false,
      isNew: data.isNew ?? false,
    },
  })

  if (data.stock > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        type: "RESTOCK",
        quantity: data.stock,
        reason: "Stock initial à la création",
        adminId: session.id,
      },
    })
  }

  await logAudit(session, "store.product_create", "Product", product.id, product.name)

  return NextResponse.json({ ok: true, product })
}
