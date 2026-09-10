import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { variantSchema } from "@/features/store/product-schema"

type Params = { params: Promise<{ id: string }> }

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
  const parsed = variantSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const dup = await prisma.productVariant.findUnique({ where: { sku: data.sku } })
  if (dup) return NextResponse.json({ error: "Ce SKU existe déjà" }, { status: 409 })

  const variant = await prisma.productVariant.create({
    data: {
      productId: id,
      label: data.label,
      attributes: JSON.stringify(data.attributes),
      sku: data.sku,
      priceOverride: data.priceOverride ?? null,
      stock: data.stock,
      active: data.active ?? true,
    },
  })

  if (data.stock > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: id,
        variantId: variant.id,
        type: "RESTOCK",
        quantity: data.stock,
        reason: "Stock initial à la création de la variante",
        adminId: session.id,
      },
    })
  }

  return NextResponse.json({ ok: true, variant })
}

const updateSchema = z.object({
  variantId: z.string().min(1),
  stock: z.coerce.number().int().min(0).optional(),
  priceOverride: z.coerce.number().int().min(0).nullable().optional(),
  active: z.boolean().optional(),
  label: z.string().trim().min(1).max(80).optional(),
})

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }
  const { variantId, ...data } = parsed.data

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  if (!variant || variant.productId !== id) {
    return NextResponse.json({ error: "Variante introuvable" }, { status: 404 })
  }

  const stockDelta =
    typeof data.stock === "number" && data.stock !== variant.stock ? data.stock - variant.stock : 0

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.priceOverride !== undefined && { priceOverride: data.priceOverride }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.label !== undefined && { label: data.label }),
    },
  })

  if (stockDelta !== 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: id,
        variantId,
        type: "ADJUSTMENT",
        quantity: stockDelta,
        reason: "Ajustement via fiche produit",
        adminId: session.id,
      },
    })
  }

  return NextResponse.json({ ok: true, variant: updated })
}
