import { NextResponse } from "next/server"
import {
  createMemberSessionToken,
  MEMBER_COOKIE,
  memberCookieOptions,
} from "@/lib/member-auth"
import {
  findAdherentByTelAndCode,
  memberLoginSchema,
  serializeMemberPortal,
} from "@/lib/member-portal"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`mon-espace-login:${ip}`, 8, 15 * 60 * 1000)
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

  const parsed = memberLoginSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Identifiants incorrects." },
      { status: 400 }
    )
  }

  // Un code à 4 chiffres/caractères a un espace de recherche réduit — on
  // limite aussi par numéro ciblé, pas seulement par IP (protège contre un
  // brute-force distribué sur un seul compte).
  const perTel = rateLimit(`mon-espace-login-tel:${parsed.data.tel}`, 8, 15 * 60 * 1000)
  if (!perTel.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    )
  }

  const adherent = await findAdherentByTelAndCode(
    parsed.data.tel,
    parsed.data.suffix
  )
  if (!adherent) {
    return NextResponse.json(
      { error: "Identifiants incorrects." },
      { status: 403 }
    )
  }

  const name = `${adherent.prenoms} ${adherent.nom}`.trim()
  const token = await createMemberSessionToken(
    { adherentId: adherent.id, name },
    adherent.sessionVersion
  )

  const res = NextResponse.json({
    ok: true,
    member: await serializeMemberPortal(adherent),
  })
  res.cookies.set(MEMBER_COOKIE, token, memberCookieOptions())
  return res
}
