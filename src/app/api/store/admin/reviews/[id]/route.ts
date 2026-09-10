import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { reviewStatusSchema } from "@/features/store/review-schema"
import { logAudit } from "@/lib/audit-log"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params

  const body = await request.json()
  const parsed = reviewStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
  }

  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 })
  }

  const review = await prisma.review.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  await logAudit(
    session,
    "store.review_moderate",
    "Review",
    id,
    `${existing.status} → ${review.status}`
  )

  return NextResponse.json({ ok: true, review })
}
