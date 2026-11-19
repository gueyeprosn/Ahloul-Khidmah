/**
 * Paiement de secours : tant que PayDunya est indisponible, l'adhésion est
 * enregistrée « en attente » et le visiteur est invité à payer par Wave.
 * Se désactive tout seul dès que PayDunya répond de nouveau.
 */
export const WAVE_FALLBACK_NUMBER =
  process.env.WAVE_FALLBACK_NUMBER?.trim() || "+221 75 525 00 02"

/**
 * Interrupteur du secours Wave. Désactivé par défaut : PayDunya est le seul
 * parcours de paiement. Pour le réactiver en cas de nouvelle panne :
 * WAVE_FALLBACK_ENABLED=1 dans .env puis `pm2 reload ecosystem.config.cjs --update-env`.
 */
export const WAVE_FALLBACK_ENABLED = process.env.WAVE_FALLBACK_ENABLED === "1"
