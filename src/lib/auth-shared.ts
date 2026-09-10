export const AUTH_COOKIE = "ak_session"

/// Rôle unique par décision assumée (RBAC granulaire hors périmètre pour
/// l'instant — voir Audit Boutique §14, Audit Plateforme §12/§14, Plan
/// d'amélioration Phase 1). Conséquence directe : tout compte admin peut
/// créer/désactiver n'importe quel autre compte (api/admins/route.ts), sans
/// distinction de pouvoir. Impact nul tant qu'un seul admin existe en
/// production (vérifié au 10/09/2026) ; à rouvrir dès qu'un deuxième compte
/// admin est créé — introduire alors un rôle distinct habilité seul à gérer
/// les comptes (POST/PATCH /api/admins), plutôt que d'étendre ce Set.
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
