import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import {
  ALLOWED_ROLES,
  AUTH_COOKIE,
  isCookieSecure,
} from "@/lib/auth-shared"

export {
  AUTH_COOKIE,
  ALLOWED_ROLES,
  isCookieSecure,
  safeInternalPath,
} from "@/lib/auth-shared"

export type SessionUser = {
  id: string
  email: string
  name: string
  role: string
}

type SessionTokenPayload = SessionUser & { sv: number }

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court (min. 32 caractères)")
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(user: SessionUser, sessionVersion: number) {
  if (!ALLOWED_ROLES.has(user.role)) {
    throw new Error("Rôle non autorisé")
  }
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sv: sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

async function verifySessionToken(
  token: string
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.sv !== "number" ||
      !ALLOWED_ROLES.has(payload.role)
    ) {
      return null
    }
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      sv: payload.sv,
    }
  } catch {
    return null
  }
}

/**
 * Vérifie le JWT puis re-contrôle en base que la session n'a pas été
 * révoquée depuis : sessionVersion doit toujours correspondre (invalidé au
 * changement de mot de passe) et le compte doit toujours être actif. Un
 * "logout" client seul ne suffit pas à invalider un jeton volé — ce contrôle
 * serveur ferme ce trou (cf. audit sécurité, point 9).
 */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(AUTH_COOKIE)?.value
  if (!token) return null
  const decoded = await verifySessionToken(token)
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { active: true, sessionVersion: true },
  })
  if (!user || !user.active || user.sessionVersion !== decoded.sv) {
    return null
  }

  return {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error("UNAUTHORIZED")
  return session
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  if (!user.active) return null
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return null
  if (!ALLOWED_ROLES.has(user.role)) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionVersion: user.sessionVersion,
  }
}

export function sessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: isCookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  }
}
