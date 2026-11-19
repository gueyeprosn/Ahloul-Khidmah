#!/usr/bin/env bash
# Vérifie si PayDunya bloque encore ce serveur (403 Cloudflare).
# Appel à corps vide : ne crée aucune facture. Lancé toutes les heures par cron.
# Journal : /var/log/paydunya-check.log — la ligne "DEBLOQUE" apparaît quand le
# code HTTP n'est plus 403 ; /var/log/paydunya-debloque.flag est alors créé.

set -uo pipefail

APP_DIR="/var/www/ahloul-khidma"
LOG="/var/log/paydunya-check.log"
FLAG="/var/log/paydunya-debloque.flag"

set -a
# shellcheck disable=SC1091
. "$APP_DIR/.env"
set +a

case "${PAYDUNYA_MODE:-test}" in
  live) BASE="https://app.paydunya.com/api/v1" ;;
  *)    BASE="https://app.paydunya.com/sandbox-api/v1" ;;
esac

code=$(curl -s -m 20 -o /dev/null -w "%{http_code}" -X POST "$BASE/checkout-invoice/create" \
  -H "Content-Type: application/json" \
  -H "PAYDUNYA-MASTER-KEY: ${PAYDUNYA_MASTER_KEY:-}" \
  -H "PAYDUNYA-PRIVATE-KEY: ${PAYDUNYA_PRIVATE_KEY:-}" \
  -H "PAYDUNYA-TOKEN: ${PAYDUNYA_TOKEN:-}" \
  -d '{}')

now=$(date -u +"%Y-%m-%d %H:%M UTC")

if [ "$code" = "403" ]; then
  echo "$now HTTP 403 — toujours bloqué" >> "$LOG"
  rm -f "$FLAG"
elif [ "$code" = "000" ]; then
  echo "$now HTTP 000 — PayDunya injoignable (réseau)" >> "$LOG"
else
  echo "$now HTTP $code — DEBLOQUE (plus de 403 Cloudflare)" >> "$LOG"
  echo "$now HTTP $code" > "$FLAG"
fi
