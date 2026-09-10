import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { reviewSubmitSchema } from "@/features/store/review-schema"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/**
 * Soumission d'avis — toujours liée à une commande réellement payée
 * contenant le produit concerné. Aucun avis anonyme non vérifié possible :
 * pas de champ "nom/téléphone" libre ici, tout vient de la commande.
 */
export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`store-review:${ip}`, 10, 60 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop de demandes" }, { status: 429 })
  }

  const body = await request.json()
  const parsed = reviewSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { orderId, productId, rating, comment } = parsed.data

  if ((body.website ?? "").trim().length > 0) {
    return NextResponse.json({ error: "Requête rejetée" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order || order.paymentStatus !== "PAID") {
    return NextResponse.json(
      { error: "Seuls les clients ayant réellement acheté ce produit peuvent laisser un avis" },
      { status: 403 }
    )
  }
  const purchasedThisProduct = order.items.some((i) => i.productId === productId)
  if (!purchasedThisProduct) {
    return NextResponse.json(
      { error: "Ce produit ne fait pas partie de cette commande" },
      { status: 403 }
    )
  }

  const existing = await prisma.review.findUnique({
    where: { orderId_productId: { orderId, productId } },
  })
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà laissé un avis pour ce produit" }, { status: 409 })
  }

  const review = await prisma.review.create({
    data: {
      productId,
      orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      rating,
      comment,
      status: "PENDING",
    },
  })

  return NextResponse.json({
    ok: true,
    review: { id: review.id, status: review.status },
  })
}
