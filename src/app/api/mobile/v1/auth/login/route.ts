import { NextResponse } from "next/server"
import { z } from "zod"
import {
  findAdherentForLogin,
  memberLoginSchema,
  serializeMemberPortal,
} from "@/lib/member-portal"
import { clientIp } from "@/lib/rate-limit"
import { rateLimitPersistent, rateLimitReset } from "@/lib/rate-limit-persistent"
import { deviceSchema, mobileError, rateLimited, readJson } from "@/lib/mobile/http"
import { createMobileSession } from "@/lib/mobile/session"
import { PIN_SETUP_TTL_SECONDS, signMobileToken } from "@/lib/mobile/tokens"

const bodySchema = memberLoginSchema.extend({ device: deviceSchema })
const WINDOW = 15 * 60 * 1000

/**
 * Connexion mobile : téléphone + PIN.
 * Un membre qui n'a pas encore de PIN présente le suffixe de son badge ;
 * il reçoit alors UNIQUEMENT un jeton à usage unique de création de PIN
 * (jamais une session) — le suffixe n'est pas un secret, il ne doit pas
 * ouvrir l'application.
 */
export async function POST(request: Request) {
  // Limite par IP volontairement large : derrière le CGNAT des opérateurs
  // mobiles, de nombreux membres partagent la même IP publique. La vraie
  // protection contre le brute-force est la limite par numéro ci-dessous.
  const ipLimit = await rateLimitPersistent(`m-login-ip:${clientIp(request)}`, 100, WINDOW)
  if (!ipLimit.ok) return rateLimited(ipLimit.retryAfter)

  const json = await readJson(request)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return mobileError("invalid_request", "Identifiants incorrects.", 400)
  }
  const { tel, suffix: code, device } = parsed.data

  // Limite par numéro ciblé (9 derniers chiffres) : 5 essais / 15 min.
  const digits = tel.replace(/\D/g, "").slice(-9)
  const telKey = `m-login-tel:${digits}`
  const telLimit = await rateLimitPersistent(telKey, 5, WINDOW)
  if (!telLimit.ok) return rateLimited(telLimit.retryAfter)

  const found = await findAdherentForLogin(tel, code)
  if (!found) {
    return mobileError("invalid_credentials", "Identifiants incorrects.", 403)
  }
  await rateLimitReset(telKey)
  const { adherent, method } = found

  if (method === "suffix") {
    const setupToken = await signMobileToken(
      { adherentId: adherent.id, sv: adherent.sessionVersion, scope: "pin_setup" },
      PIN_SETUP_TTL_SECONDS
    )
    return NextResponse.json({ status: "pin_setup_required", setupToken })
  }

  const tokens = await createMobileSession(adherent, device ?? {})
  return NextResponse.json({
    status: "ok",
    ...tokens,
    member: await serializeMemberPortal(adherent),
  })
}

export type LoginBody = z.infer<typeof bodySchema>
