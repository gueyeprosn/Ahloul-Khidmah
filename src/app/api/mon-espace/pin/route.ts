import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getMemberSession } from "@/lib/member-auth"
import { hashMemberPin, pinSetSchema } from "@/lib/member-pin"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const ip = clientIp(request)
  const limited = rateLimit(`mon-espace-pin:${ip}`, 10, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const parsed = pinSetSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Code invalide",
      },
      { status: 400 }
    )
  }

  const pinHash = await hashMemberPin(parsed.data.pin)
  await prisma.adherent.update({
    where: { id: session.adherentId },
    data: { pinHash },
  })

  return NextResponse.json({ ok: true })
}
