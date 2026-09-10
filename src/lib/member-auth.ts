import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { isCookieSecure } from "@/lib/auth-shared"

export const MEMBER_COOKIE = "ak_member"

export type MemberSession = {
  adherentId: string
  name: string
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court (min. 32 caractères)")
  }
  return new TextEncoder().encode(secret)
}

export async function createMemberSessionToken(session: MemberSession) {
  return new SignJWT({
    role: "member",
    adherentId: session.adherentId,
    name: session.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifyMemberSessionToken(
  token: string
): Promise<MemberSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      payload.role !== "member" ||
      typeof payload.adherentId !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null
    }
    return {
      adherentId: payload.adherentId,
      name: payload.name,
    }
  } catch {
    return null
  }
}

export async function getMemberSession(): Promise<MemberSession | null> {
  const jar = await cookies()
  const token = jar.get(MEMBER_COOKIE)?.value
  if (!token) return null
  return verifyMemberSessionToken(token)
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
