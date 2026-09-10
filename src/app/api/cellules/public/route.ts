import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/** Liste publique des cellules pour autocomplete adhésion */
export async function GET() {
  const cellules = await prisma.cellule.findMany({
    orderBy: { name: "asc" },
    select: { name: true, zone: true },
  })

  return NextResponse.json(
    { cellules },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  )
}
