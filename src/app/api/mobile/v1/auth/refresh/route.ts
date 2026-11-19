import { NextResponse } from "next/server"
import { z } from "zod"
import { clientIp } from "@/lib/rate-limit"
import { rateLimitPersistent } from "@/lib/rate-limit-persistent"
import { deviceSchema, mobileError, rateLimited, readJson } from "@/lib/mobile/http"
import { refreshMobileSession } from "@/lib/mobile/session"

const bodySchema = z.object({
  refreshToken: z.string().min(20).max(200),
  device: deviceSchema,
})

export async function POST(request: Request) {
  const limit = await rateLimitPersistent(`m-refresh-ip:${clientIp(request)}`, 120, 15 * 60 * 1000)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const parsed = bodySchema.safeParse(await readJson(request))
  if (!parsed.success) return mobileError("invalid_request", "Requête invalide.", 400)

  const tokens = await refreshMobileSession(parsed.data.refreshToken, parsed.data.device ?? {})
  if (!tokens) return mobileError("invalid_refresh", "Session expirée, reconnectez-vous.", 401)
  return NextResponse.json({ status: "ok", ...tokens })
}
