import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const reviews = await prisma.review.findMany({
    where: status ? { status } : undefined,
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json({ reviews })
}
