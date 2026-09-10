#!/usr/bin/env bash
# Installation initiale Ahloul Khidmah sur VPS Hostinger
# IP: 191.218.163.29 | Domaine: ahloulkhidmah.org
#
# Sur le VPS (en root) :
#   bash setup-vps.sh
# ou après upload :
#   cd /var/www/ahloul-khidma && bash deploy/setup-vps.sh

set -euo pipefail

DOMAIN="ahloulkhidmah.org"
APP_DIR="/var/www/ahloul-khidma"
APP_NAME="ahloul-khidma"

echo "=== 1. Paquets système ==="
apt update
apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1; then
  echo "=== 2. Node.js 22 ==="
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
fi

echo "Node: $(node -v) | npm: $(npm -v)"

echo "=== 3. PM2 ==="
npm install -g pm2

echo "=== 4. App ==="
mkdir -p /var/www/certbot
cd "$APP_DIR"

if [ ! -f package.json ]; then
  echo "ERREUR: package.json introuvable dans $APP_DIR"
  echo "Uploadez d'abord le projet dans $APP_DIR"
  exit 1
fi

npm ci
npm run build

echo "=== 5. PM2 start ==="
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true

echo "=== 6. Nginx ==="
cp deploy/nginx.ahloul-khidma.conf /etc/nginx/sites-available/ahloul-khidma
ln -sf /etc/nginx/sites-available/ahloul-khidma /etc/nginx/sites-enabled/ahloul-khidma
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "=== 7. SSL Let's Encrypt ==="
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || {
  echo "Certbot a échoué (DNS pas encore propagé ?). Relancez plus tard :"
  echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
}

echo ""
echo "✓ Terminé. Site: https://$DOMAIN"
pm2 status
