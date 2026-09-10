import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { temoignageCreateSchema } from "@/features/temoignages/schema"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const testimonials = await prisma.testimonial.findMany({
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json({ testimonials })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = temoignageCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Citation FR/AR et nom requis", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { quoteFr, quoteAr, name, roleFr, roleAr, published } = parsed.data

  const max = await prisma.testimonial.aggregate({
    _max: { sortOrder: true },
  })

  const testimonial = await prisma.testimonial.create({
    data: {
      quoteFr,
      quoteAr,
      name,
      roleFr: roleFr || "—",
      roleAr: roleAr || "—",
      published: published !== false,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json({ ok: true, testimonial })
}
