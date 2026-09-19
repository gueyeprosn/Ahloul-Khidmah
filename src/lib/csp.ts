export const CSP_NONCE_HEADER = "x-nonce"

/**
 * CSP par nonce (audit sécurité 2026, V-03) : remplace 'unsafe-inline' pour
 * script-src par un nonce généré à chaque requête (voir middleware.ts) —
 * un script injecté par un attaquant ne peut pas connaître ce nonce et ne
 * s'exécute donc pas, même en cas de faille XSS ailleurs dans le code.
 *
 * 'unsafe-inline' reste listé en repli : les navigateurs qui comprennent
 * 'nonce-' l'ignorent automatiquement (CSP niveau 2+, recommandation
 * officielle du W3C pour la compatibilité ascendante) — il n'affaiblit donc
 * pas la protection sur un navigateur moderne, seulement sur un navigateur
 * pré-2015 qui ignorerait 'nonce-' lui-même.
 *
 * 'strict-dynamic' autorise les scripts chargés PAR un script de confiance
 * (nonce valide) même hors de l'allowlist d'hôtes — nécessaire pour gtag.js,
 * qui charge lui-même d'autres ressources Google Analytics à l'exécution.
 */
export function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://app.paydunya.com https://paydunya.com",
    "font-src 'self' data:",
    "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://pay.wave.com https://app.paydunya.com https://orangemoneysn.page.link https://sugu.orange-sonatel.com",
    "object-src 'none'",
  ].join("; ")
}
