import { NextResponse } from "next/server"
import { z } from "zod"

/** Erreur normalisée de l'API mobile : { error: { code, message } }. */
export function mobileError(
  code: string,
  message: string,
  status: number,
  headers?: Record<string, string>
) {
  return NextResponse.json({ error: { code, message } }, { status, headers })
}

export function rateLimited(retryAfter: number) {
  return mobileError(
    "rate_limited",
    "Trop de tentatives. Réessayez plus tard.",
    429,
    { "Retry-After": String(retryAfter) }
  )
}

export const deviceSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    platform: z.enum(["android", "ios"]),
    appVersion: z.string().trim().max(32).optional(),
  })
  .optional()

export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization") || ""
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1].trim() : null
}
