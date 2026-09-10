import { NextResponse } from "next/server"
import {
  AUTH_COOKIE,
  authenticate,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    )
  }

  try {
    const body = await request.json()
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
      .slice(0, 160)
    const password = String(body.password || "").slice(0, 200)

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      )
    }

    // Délai constant approximatif contre timing user enumeration
    const user = await authenticate(email, password)
    if (!user) {
      await new Promise((r) => setTimeout(r, 300))
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      )
    }

    const token = await createSessionToken(user, user.sessionVersion)
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
    res.cookies.set(AUTH_COOKIE, token, sessionCookieOptions())
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
