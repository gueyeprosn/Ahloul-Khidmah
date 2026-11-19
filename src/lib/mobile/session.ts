import { prisma } from "@/lib/db"
import {
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_MS,
  hashRefreshToken,
  newRefreshToken,
  signMobileToken,
  verifyMobileToken,
} from "@/lib/mobile/tokens"
import { bearerToken } from "@/lib/mobile/http"

export type DeviceInfo = {
  name?: string
  platform?: "android" | "ios"
  appVersion?: string
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

async function issueAccess(adherentId: string, sv: number, sid: string) {
  return signMobileToken(
    { adherentId, sv, sid, scope: "access" },
    ACCESS_TTL_SECONDS
  )
}

export async function createMobileSession(
  adherent: { id: string; sessionVersion: number },
  device: DeviceInfo = {}
): Promise<TokenPair> {
  const refresh = newRefreshToken()
  const session = await prisma.mobileSession.create({
    data: {
      adherentId: adherent.id,
      refreshHash: refresh.hash,
      deviceName: device.name,
      platform: device.platform,
      appVersion: device.appVersion,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  })
  return {
    accessToken: await issueAccess(adherent.id, adherent.sessionVersion, session.id),
    refreshToken: refresh.token,
    expiresIn: ACCESS_TTL_SECONDS,
  }
}

/**
 * Rotation du refresh token. Si un ancien jeton déjà remplacé est présenté
 * (vol probable), toute la session est révoquée.
 */
export async function refreshMobileSession(
  refreshToken: string,
  device: DeviceInfo = {}
): Promise<TokenPair | null> {
  const hash = hashRefreshToken(refreshToken)
  const now = new Date()

  const session = await prisma.mobileSession.findUnique({
    where: { refreshHash: hash },
    include: { adherent: { select: { id: true, sessionVersion: true } } },
  })

  if (!session) {
    const reused = await prisma.mobileSession.findFirst({
      where: { prevRefreshHash: hash, revokedAt: null },
      select: { id: true },
    })
    if (reused) {
      await prisma.mobileSession.update({
        where: { id: reused.id },
        data: { revokedAt: now },
      })
    }
    return null
  }
  if (session.revokedAt || session.expiresAt <= now) return null

  const next = newRefreshToken()
  // Mise à jour conditionnelle : deux refresh simultanés avec le même jeton
  // ne peuvent pas réussir tous les deux.
  const updated = await prisma.mobileSession.updateMany({
    where: { id: session.id, refreshHash: hash, revokedAt: null },
    data: {
      refreshHash: next.hash,
      prevRefreshHash: hash,
      lastUsedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
      ...(device.appVersion ? { appVersion: device.appVersion } : {}),
    },
  })
  if (updated.count !== 1) return null

  return {
    accessToken: await issueAccess(
      session.adherent.id,
      session.adherent.sessionVersion,
      session.id
    ),
    refreshToken: next.token,
    expiresIn: ACCESS_TTL_SECONDS,
  }
}

export async function revokeMobileSession(refreshToken: string) {
  const hash = hashRefreshToken(refreshToken)
  await prisma.mobileSession.updateMany({
    where: { OR: [{ refreshHash: hash }, { prevRefreshHash: hash }], revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export type MobileAuth = { adherentId: string; sessionId: string }

/** Authentifie une requête par jeton Bearer + contrôle serveur de la session. */
export async function authenticateMobile(
  request: Request
): Promise<MobileAuth | null> {
  const token = bearerToken(request)
  if (!token) return null
  const claims = await verifyMobileToken(token, "access")
  if (!claims || !claims.sid) return null

  const session = await prisma.mobileSession.findUnique({
    where: { id: claims.sid },
    select: {
      adherentId: true,
      revokedAt: true,
      expiresAt: true,
      adherent: { select: { sessionVersion: true } },
    },
  })
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.adherentId !== claims.adherentId ||
    session.adherent.sessionVersion !== claims.sv
  ) {
    return null
  }
  return { adherentId: claims.adherentId, sessionId: claims.sid }
}
