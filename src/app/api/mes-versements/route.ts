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

/** Conservé pour compatibilité — crée aussi la session mon-espace. */
export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`mes-versements:${ip}`, 8, 15 * 60 * 1000)
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

  const portal = await serializeMemberPortal(adherent)
  const token = await createMemberSessionToken(
    { adherentId: adherent.id, name: portal.name },
    adherent.sessionVersion
  )

  const res = NextResponse.json({
    ok: true,
    member: {
      id: portal.id,
      name: portal.name,
      suffix: portal.suffix,
      status: portal.status,
      cotisationPrevue: portal.cotisationPrevue,
      versements: portal.versements,
    },
    redirect: "/mon-espace",
  })
  res.cookies.set(MEMBER_COOKIE, token, memberCookieOptions())
  return res
}
