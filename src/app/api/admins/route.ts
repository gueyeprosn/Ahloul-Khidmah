import { NextResponse } from "next/server"
import { getSession, hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { adminCreateSchema, adminToggleActiveSchema } from "@/features/admins/schema"
import { logAudit } from "@/lib/audit-log"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const admins = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ admins })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = adminCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { name, email, password } = parsed.data

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: "Cet email existe déjà" }, { status: 400 })
  }

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "admin",
      active: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    },
  })

  await logAudit(session, "admin.create", "User", admin.id, `email: ${admin.email}`)

  return NextResponse.json({ ok: true, admin })
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = adminToggleActiveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { id, active } = parsed.data
  if (id === session.id && !active) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas désactiver votre propre compte" },
      { status: 400 }
    )
  }

  if (!active) {
    const remaining = await prisma.user.count({
      where: { active: true, id: { not: id } },
    })
    if (remaining < 1) {
      return NextResponse.json(
        { error: "Il doit rester au moins un administrateur actif" },
        { status: 400 }
      )
    }
  }

  const admin = await prisma.user.update({
    where: { id },
    data: { active },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
    },
  })

  await logAudit(
    session,
    active ? "admin.activate" : "admin.deactivate",
    "User",
    admin.id,
    `email: ${admin.email}`
  )

  return NextResponse.json({ ok: true, admin })
}
