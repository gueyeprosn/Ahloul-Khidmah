import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createMemberSessionToken,
  getMemberSession,
  MEMBER_COOKIE,
  memberCookieOptions,
} from "@/lib/member-auth"
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
  // sessionVersion incrémenté : invalide toute autre session /mon-espace déjà
  // ouverte ailleurs (voir lib/member-auth.ts getMemberSession()) — un jeton
  // frais est réémis juste après pour l'onglet courant, qui ne se retrouve
  // donc pas déconnecté par sa propre action.
  const adherent = await prisma.adherent.update({
    where: { id: session.adherentId },
    data: { pinHash, sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  })

  const token = await createMemberSessionToken(session, adherent.sessionVersion)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(MEMBER_COOKIE, token, memberCookieOptions())
  return res
}
