import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { isCookieSecure } from "@/lib/auth-shared"
import { prisma } from "@/lib/db"

export const MEMBER_COOKIE = "ak_member"

export type MemberSession = {
  adherentId: string
  name: string
}

type MemberTokenPayload = MemberSession & { sv: number }

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court (min. 32 caractères)")
  }
  return new TextEncoder().encode(secret)
}

export async function createMemberSessionToken(
  session: MemberSession,
  sessionVersion: number
) {
  return new SignJWT({
    role: "member",
    adherentId: session.adherentId,
    name: session.name,
    sv: sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

async function verifyMemberSessionToken(
  token: string
): Promise<MemberTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      payload.role !== "member" ||
      typeof payload.adherentId !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.sv !== "number"
    ) {
      return null
    }
    return {
      adherentId: payload.adherentId,
      name: payload.name,
      sv: payload.sv,
    }
  } catch {
    return null
  }
}

/**
 * Vérifie le JWT puis re-contrôle en base que la session n'a pas été
 * révoquée depuis (sessionVersion incrémenté au changement de PIN, par le
 * membre ou par un admin) — même contrôle que lib/auth.ts getSession() côté
 * admin. Un jeton volé reste sinon valable jusqu'à 7 jours même après que le
 * PIN a été changé.
 */
export async function getMemberSession(): Promise<MemberSession | null> {
  const jar = await cookies()
  const token = jar.get(MEMBER_COOKIE)?.value
  if (!token) return null
  const decoded = await verifyMemberSessionToken(token)
  if (!decoded) return null

  const adherent = await prisma.adherent.findUnique({
    where: { id: decoded.adherentId },
    select: { sessionVersion: true },
  })
  if (!adherent || adherent.sessionVersion !== decoded.sv) {
    return null
  }

  return {
    adherentId: decoded.adherentId,
    name: decoded.name,
  }
}

export function memberCookieOptions(maxAgeSec = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  }
}
