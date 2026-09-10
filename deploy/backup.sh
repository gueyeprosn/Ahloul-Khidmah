#!/usr/bin/env bash
# Sauvegarde quotidienne Ahloul Khidmah — base de données + photos membres.
# Ne lit et ne copie que des données existantes : ne modifie jamais les
# fichiers de production. Conçu pour être lancé par cron chaque nuit.
#
# Alerte WhatsApp (silencieuse si tout va bien) : en cas d'échec de la
# sauvegarde ou de disque presque plein, un message est envoyé à
# ALERT_WHATSAPP_NUMBER (.env) — réutilise les identifiants WhatsApp Cloud
# déjà configurés pour l'envoi des cartes membres. Si cette variable ou les
# identifiants WhatsApp ne sont pas renseignés, l'alerte est simplement
# journalisée au lieu d'être envoyée (aucune erreur bloquante).
#
# Usage manuel : bash deploy/backup.sh
set -euo pipefail

APP_DIR="/var/www/ahloul-khidma"
BACKUP_DIR="/var/backups/ahloul-khidma"
RETENTION_DAYS=14
DISK_ALERT_THRESHOLD=85
TS=$(date +%Y%m%d-%H%M%S)

# Charge la config (jetons WhatsApp, etc.) sans jamais l'afficher.
set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

send_alert() {
  local message="$1"
  echo "$(date -Is) → ALERTE : $message" >&2
  if [ -z "${WHATSAPP_TOKEN:-}" ] || [ -z "${WHATSAPP_PHONE_NUMBER_ID:-}" ] || [ -z "${ALERT_WHATSAPP_NUMBER:-}" ]; then
    echo "$(date -Is) → (non envoyée par WhatsApp : ALERT_WHATSAPP_NUMBER ou identifiants WhatsApp absents)" >&2
    return 0
  fi
  curl -s -X POST "https://graph.facebook.com/${WHATSAPP_API_VERSION:-v21.0}/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
    -H "Authorization: Bearer ${WHATSAPP_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"messaging_product\":\"whatsapp\",\"to\":\"${ALERT_WHATSAPP_NUMBER}\",\"type\":\"text\",\"text\":{\"body\":\"$message\"}}" \
    > /dev/null || true
}

mkdir -p "$BACKUP_DIR"

echo "$(date -Is) → début sauvegarde $TS"

# Copie cohérente de la base (sûre même si le site écrit en même temps —
# la commande .backup de SQLite gère ça correctement, contrairement à un
# simple "cp" qui pourrait copier un fichier en cours d'écriture).
if ! sqlite3 "$APP_DIR/data/ahloul.db" ".backup '$BACKUP_DIR/auto-db-$TS.db'"; then
  send_alert "⚠️ Ahloul Khidmah : échec de la sauvegarde de la base de données ($TS)."
  exit 1
fi

# Vérifie que la copie n'est pas corrompue avant de la considérer valide.
CHECK=$(sqlite3 "$BACKUP_DIR/auto-db-$TS.db" "PRAGMA integrity_check;")
if [ "$CHECK" != "ok" ]; then
  send_alert "⚠️ Ahloul Khidmah : la sauvegarde de la base a échoué son contrôle d'intégrité ($TS)."
  exit 1
fi

# Copie de sécurité hors-serveur (Firebase Storage) — silencieuse si non
# configurée (FIREBASE_STORAGE_BUCKET / FIREBASE_SERVICE_ACCOUNT_PATH
# absents de .env). Un échec ici n'est qu'une alerte : la sauvegarde locale
# ci-dessus reste la copie de référence, jamais bloquée par ce qui suit.
if [ -n "${FIREBASE_STORAGE_BUCKET:-}" ] && [ -n "${FIREBASE_SERVICE_ACCOUNT_PATH:-}" ]; then
  if ! node "$APP_DIR/deploy/backup-to-firebase.mjs" "$BACKUP_DIR/auto-db-$TS.db"; then
    send_alert "⚠️ Ahloul Khidmah : échec de la copie de sauvegarde vers Firebase ($TS) — la sauvegarde locale reste valide."
  fi
fi

# Archive des photos de profil ajoutées par les membres.
if ! tar -czf "$BACKUP_DIR/auto-uploads-$TS.tar.gz" -C "$APP_DIR/public" uploads; then
  send_alert "⚠️ Ahloul Khidmah : échec de la sauvegarde des photos membres ($TS)."
  exit 1
fi

# Nettoyage : supprime uniquement NOS sauvegardes automatiques (préfixe
# "auto-") de plus de RETENTION_DAYS jours. Ne touche jamais aux
# sauvegardes manuelles nommées différemment (ex. "pre-...", "manual-...").
find "$BACKUP_DIR" -maxdepth 1 -name "auto-db-*.db" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -name "auto-uploads-*.tar.gz" -mtime "+$RETENTION_DAYS" -delete

# Alerte si le disque est presque plein (silencieux sinon).
DISK_USE=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "$DISK_USE" -ge "$DISK_ALERT_THRESHOLD" ]; then
  send_alert "⚠️ Ahloul Khidmah : disque serveur à ${DISK_USE}% plein."
fi

echo "$(date -Is) → sauvegarde $TS terminée avec succès (disque: ${DISK_USE}%)"
