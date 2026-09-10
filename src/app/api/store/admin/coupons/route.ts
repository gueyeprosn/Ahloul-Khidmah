import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { couponSchema } from "@/features/store/coupon-schema"
import { logAudit } from "@/lib/audit-log"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { usages: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ coupons })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = couponSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const data = parsed.data
  const code = data.code.toUpperCase()

  const existing = await prisma.coupon.findUnique({ where: { code } })
  if (existing) {
    return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 })
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: data.type,
      value: data.value,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      minOrderAmount: data.minOrderAmount,
      maxUses: data.maxUses ?? null,
      usesPerCustomer: data.usesPerCustomer ?? null,
      active: data.active ?? true,
      membersOnly: data.membersOnly ?? false,
    },
  })

  await logAudit(session, "store.coupon_create", "Coupon", coupon.id, coupon.code)

  return NextResponse.json({ ok: true, coupon })
}
