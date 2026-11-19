import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAdherentForMemberSession, serializeMemberPortal } from "@/lib/member-portal"
import { hashMemberPin, pinSetSchema } from "@/lib/member-pin"
import { rateLimitPersistent } from "@/lib/rate-limit-persistent"
import { bearerToken, deviceSchema, mobileError, rateLimited, readJson } from "@/lib/mobile/http"
import { createMobileSession } from "@/lib/mobile/session"
import { verifyMobileToken } from "@/lib/mobile/tokens"

/** Création du premier PIN avec le jeton `pin_setup`, puis ouverture de session. */
export async function POST(request: Request) {
  const token = bearerToken(request)
  const claims = token ? await verifyMobileToken(token, "pin_setup") : null
  if (!claims) return mobileError("unauthorized", "Session expirée.", 401)

  const limit = await rateLimitPersistent(`m-pin:${claims.adherentId}`, 5, 15 * 60 * 1000)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const json = (await readJson(request)) as Record<string, unknown> | null
  const parsed = pinSetSchema.safeParse(json)
  const device = deviceSchema.safeParse(json?.device)
  if (!parsed.success || !device.success) {
    return mobileError(
      "invalid_request",
      parsed.success ? "Requête invalide." : parsed.error.issues[0]?.message || "Code invalide",
      400
    )
  }

  const current = await prisma.adherent.findUnique({
    where: { id: claims.adherentId },
    select: { pinHash: true, sessionVersion: true },
  })
  if (!current || current.sessionVersion !== claims.sv) {
    return mobileError("unauthorized", "Session expirée.", 401)
  }
  // Jeton réservé aux comptes sans PIN : jamais pour remplacer un PIN existant.
  if (current.pinHash) {
    return mobileError("pin_already_set", "Un code PIN existe déjà.", 409)
  }

  const updated = await prisma.adherent.update({
    where: { id: claims.adherentId },
    // sessionVersion + 1 : invalide aussi les sessions web/mobile existantes.
    data: { pinHash: await hashMemberPin(parsed.data.pin), sessionVersion: { increment: 1 } },
    select: { id: true, sessionVersion: true },
  })

  const tokens = await createMobileSession(updated, device.data ?? {})
  const full = await getAdherentForMemberSession(updated.id)
  return NextResponse.json({
    status: "ok",
    ...tokens,
    member: full ? await serializeMemberPortal(full) : null,
  })
}
