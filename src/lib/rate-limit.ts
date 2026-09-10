/**
 * Rate limiting in-memory (par processus).
 * Suffisant pour un VPS mono-instance PM2.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  return { ok: true }
}

export function clientIp(request: Request): string {
  // X-Real-IP est toujours écrasé par nginx avec $remote_addr (non falsifiable).
  // X-Forwarded-For est en revanche préfixé par la valeur envoyée par le client
  // ($proxy_add_x_forwarded_for l'ajoute à la suite sans la remplacer) : le lire
  // en premier permettait à un client de choisir sa propre IP et de contourner
  // le rate limiting. X-Real-IP prime donc, X-Forwarded-For n'est qu'un repli.
  const real = request.headers.get("x-real-ip")?.trim()
  if (real) return real
  const xf = request.headers.get("x-forwarded-for")
  if (xf) {
    const first = xf.split(",")[0]?.trim()
    if (first) return first
  }
  return "unknown"
}

/** Nettoyage occasionnel pour éviter une croissance infinie. */
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
}, 60_000).unref?.()
