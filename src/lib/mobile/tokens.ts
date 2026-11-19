import { createHash, createHmac, randomBytes } from "node:crypto"
import { SignJWT, jwtVerify } from "jose"

/**
 * Jetons de l'application mobile.
 *
 * - Clé de signature DÉRIVÉE de AUTH_SECRET (HMAC avec un libellé dédié) :
 *   un jeton mobile ne peut jamais être accepté comme cookie admin/membre web
 *   (clé, audience et claims différents), et inversement.
 * - Jeton d'accès court (15 min). Le refresh token est un secret aléatoire
 *   opaque, stocké en base uniquement sous forme de hash SHA-256.
 */
export const ACCESS_TTL_SECONDS = 15 * 60
export const PIN_SETUP_TTL_SECONDS = 10 * 60
export const REFRESH_TTL_MS = 60 * 24 * 60 * 60 * 1000 // 60 jours glissants
const AUDIENCE = "ak-mobile"
const ISSUER = "ahloulkhidmah"

export type MobileScope = "access" | "pin_setup"

export type MobileClaims = {
  adherentId: string
  sv: number
  scope: MobileScope
  sid?: string
}

function signingKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court (min. 32 caractères)")
  }
  return createHmac("sha256", secret).update("ak-mobile-token-v1").digest()
}

export async function signMobileToken(claims: MobileClaims, ttlSeconds: number) {
  return new SignJWT({
    adherentId: claims.adherentId,
    sv: claims.sv,
    scope: claims.scope,
    ...(claims.sid ? { sid: claims.sid } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(signingKey())
}

export async function verifyMobileToken(
  token: string,
  scope: MobileScope
): Promise<MobileClaims | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      audience: AUDIENCE,
      issuer: ISSUER,
      algorithms: ["HS256"],
    })
    if (
      typeof payload.adherentId !== "string" ||
      typeof payload.sv !== "number" ||
      payload.scope !== scope
    ) {
      return null
    }
    return {
      adherentId: payload.adherentId,
      sv: payload.sv,
      scope,
      sid: typeof payload.sid === "string" ? payload.sid : undefined,
    }
  } catch {
    return null
  }
}

export function newRefreshToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashRefreshToken(token) }
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
