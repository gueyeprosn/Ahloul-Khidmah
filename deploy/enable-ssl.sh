#!/usr/bin/env bash
# Active HTTPS (Let's Encrypt) pour ahloulkhidmah.org
# Prérequis DNS :
#   A     ahloulkhidmah.org      → 191.218.163.29
#   A     www.ahloulkhidmah.org  → 191.218.163.29
set -euo pipefail

DOMAIN_APEX="ahloulkhidmah.org"
DOMAIN_WWW="www.ahloulkhidmah.org"
EMAIL="${SSL_EMAIL:-contact@ahloulkhidmah.org}"
WEBROOT="/var/www/certbot"
NGINX_SITE="/etc/nginx/sites-available/ahloul-khidma"

echo "==> Vérification DNS…"
APEX_IP="$(dig +short A +answer "$DOMAIN_APEX" | head -1 || true)"
WWW_IP="$(dig +short A +answer "$DOMAIN_WWW" | head -1 || true)"
SERVER_IP="$(curl -4 -s --max-time 5 ifconfig.me || hostname -I | awk '{print $1}')"

echo "    apex=$APEX_IP  www=$WWW_IP  serveur=$SERVER_IP"

if [[ -z "$APEX_IP" || -z "$WWW_IP" ]]; then
  echo "ERREUR: DNS manquant (NXDOMAIN ou pas d'enregistrement A)."
  echo "Créez chez votre registrar :"
  echo "  A  $DOMAIN_APEX      → $SERVER_IP"
  echo "  A  $DOMAIN_WWW      → $SERVER_IP"
  exit 1
fi

if [[ "$APEX_IP" != "$SERVER_IP" || "$WWW_IP" != "$SERVER_IP" ]]; then
  echo "ERREUR: les enregistrements A ne pointent pas vers ce serveur ($SERVER_IP)."
  exit 1
fi

mkdir -p "$WEBROOT"
nginx -t
systemctl reload nginx

echo "==> Demande du certificat Let's Encrypt…"
certbot certonly \
  --webroot -w "$WEBROOT" \
  -d "$DOMAIN_APEX" -d "$DOMAIN_WWW" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring

CERT_DIR="/etc/letsencrypt/live/$DOMAIN_APEX"

echo "==> Écriture de la config Nginx HTTPS…"
cat > "$NGINX_SITE" <<EOF
# HTTP → HTTPS + ACME
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_APEX $DOMAIN_WWW;

    location ^~ /.well-known/acme-challenge/ {
        root $WEBROOT;
        allow all;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_APEX $DOMAIN_WWW;

    ssl_certificate     $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # HSTS (1 an)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto https;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Assure les fichiers SSL nginx de certbot
if [[ ! -f /etc/letsencrypt/options-ssl-nginx.conf ]]; then
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o /etc/letsencrypt/options-ssl-nginx.conf
fi
if [[ ! -f /etc/letsencrypt/ssl-dhparams.pem ]]; then
  openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
fi

nginx -t
systemctl reload nginx

# Cookies Secure après HTTPS
if grep -q 'ALLOW_INSECURE_COOKIES' /var/www/ahloul-khidma/.env 2>/dev/null; then
  sed -i 's/ALLOW_INSECURE_COOKIES=.*/ALLOW_INSECURE_COOKIES="0"/' /var/www/ahloul-khidma/.env
  sed -i 's/COOKIE_SECURE=.*/COOKIE_SECURE="1"/' /var/www/ahloul-khidma/.env || echo 'COOKIE_SECURE="1"' >> /var/www/ahloul-khidma/.env
  cp /var/www/ahloul-khidma/.env /var/www/ahloul-khidma/.env.local
  chmod 600 /var/www/ahloul-khidma/.env /var/www/ahloul-khidma/.env.local
fi

# PM2: retirer la dérogation HTTP
if grep -q 'ALLOW_INSECURE_COOKIES' /var/www/ahloul-khidma/ecosystem.config.cjs; then
  sed -i 's/ALLOW_INSECURE_COOKIES: "1"/ALLOW_INSECURE_COOKIES: "0"/' /var/www/ahloul-khidma/ecosystem.config.cjs
fi
(cd /var/www/ahloul-khidma && pm2 restart ahloul-khidma --update-env) || true

# Renouvellement auto
systemctl enable --now certbot.timer 2>/dev/null || true

echo "==> HTTPS actif : https://$DOMAIN_WWW/"
echo "    Cookies Secure activés. Testez l'installation PWA depuis le téléphone."
