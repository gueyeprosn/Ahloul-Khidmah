import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { inventoryAdjustSchema } from "@/features/store/product-schema"
import { logAudit } from "@/lib/audit-log"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = inventoryAdjustSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { productId, variantId, delta, reason } = parsed.data

  if (variantId) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!variant || variant.productId !== productId) {
      return NextResponse.json({ error: "Variante introuvable" }, { status: 404 })
    }
    if (variant.stock + delta < 0) {
      return NextResponse.json({ error: "Le stock ne peut pas devenir négatif" }, { status: 400 })
    }
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: delta } },
    })
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })
    }
    if (product.stock + delta < 0) {
      return NextResponse.json({ error: "Le stock ne peut pas devenir négatif" }, { status: 400 })
    }
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: delta } },
    })
  }

  await prisma.inventoryTransaction.create({
    data: {
      productId,
      variantId: variantId || null,
      type: "ADJUSTMENT",
      quantity: delta,
      reason,
      adminId: session.id,
    },
  })

  await logAudit(
    session,
    "store.inventory_adjustment",
    "Product",
    productId,
    `${delta > 0 ? "+" : ""}${delta} — ${reason}`
  )

  return NextResponse.json({ ok: true })
}
