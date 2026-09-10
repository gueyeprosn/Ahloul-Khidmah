#!/usr/bin/env bash
# Déploiement Ahloul Khidmah sur VPS (Hostinger)
# Usage (sur le VPS) :
#   cd /var/www/ahloul-khidma && bash deploy/deploy.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/ahloul-khidma}"
APP_NAME="ahloul-khidma"

cd "$APP_DIR"

echo "→ Mise à jour du code..."
if [ -d .git ]; then
  git pull --ff-only
fi

echo "→ Installation des dépendances..."
npm ci

echo "→ Build production..."
npm run build

echo "→ Redémarrage PM2..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo "✓ Déploiement terminé."
pm2 status "$APP_NAME"
