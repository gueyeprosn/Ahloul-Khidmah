import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { couponUpdateSchema } from "@/features/store/coupon-schema"
import { logAudit } from "@/lib/audit-log"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: { _count: { select: { usages: true } } },
  })
  if (!coupon) {
    return NextResponse.json({ error: "Coupon introuvable" }, { status: 404 })
  }
  return NextResponse.json({ coupon })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params

  const body = await request.json()
  const parsed = couponUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data

  const existing = await prisma.coupon.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Coupon introuvable" }, { status: 404 })
  }

  if (data.code) {
    const newCode = data.code.toUpperCase()
    if (newCode !== existing.code) {
      const dup = await prisma.coupon.findUnique({ where: { code: newCode } })
      if (dup) return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 })
    }
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code.toUpperCase() }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
      ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
      ...(data.usesPerCustomer !== undefined && { usesPerCustomer: data.usesPerCustomer }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.membersOnly !== undefined && { membersOnly: data.membersOnly }),
    },
  })

  await logAudit(session, "store.coupon_update", "Coupon", id, coupon.code)

  return NextResponse.json({ ok: true, coupon })
}

/** Active/désactive — jamais de suppression physique (garde l'historique CouponUsage lisible). */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { id } = await params
  const existing = await prisma.coupon.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Coupon introuvable" }, { status: 404 })
  }
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { active: !existing.active },
  })
  await logAudit(
    session,
    "store.coupon_toggle",
    "Coupon",
    id,
    `${coupon.active ? "activé" : "désactivé"} — ${coupon.code}`
  )
  return NextResponse.json({ ok: true, coupon })
}
