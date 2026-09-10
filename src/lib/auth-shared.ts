export const AUTH_COOKIE = "ak_session"

export const ALLOWED_ROLES = new Set(["admin"])

/** Cookies Secure dès que COOKIE_SECURE=1 (après HTTPS). */
export function isCookieSecure() {
  if (process.env.COOKIE_SECURE === "1") return true
  if (process.env.COOKIE_SECURE === "0") return false
  return (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_INSECURE_COOKIES !== "1"
  )
}

/** Empêche open-redirect (//evil.com, https://…). */
export function safeInternalPath(next: string | null | undefined): string {
  if (!next) return "/dashboard"
  if (!next.startsWith("/")) return "/dashboard"
  if (next.startsWith("//")) return "/dashboard"
  if (next.includes("\\") || next.includes("@")) return "/dashboard"
  return next
}
