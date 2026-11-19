# CARTOGRAPHIE_SERVICES — VPS Ahloul Khidmah

> Phase 0, lecture seule, 2026-11-19. Seuls les services d'Ahloul Khidmah sont décrits ; aucun autre projet n'a été touché.

## Machine

| Élément | Valeur | Preuve |
|---|---|---|
| Système | Ubuntu 24.04.4 LTS, noyau 6.8.0-147 | `/etc/os-release` |
| Disponibilité | 4 semaines 4 jours ; **redémarrage requis** ; 49 paquets à mettre à jour | `uptime`, `/var/run/reboot-required` |
| CPU / RAM | 2 vCPU / 7,8 Go (≈ 1 Go utilisés, 6,8 Go disponibles), **pas de swap** | `nproc`, `free -h` |
| Disque | 96 Go, 17 % utilisés | `df -h` |
| Docker | Non installé | `which docker` vide |
| Autres projets | Aucun : `/var/www` ne contient qu'`ahloul-khidma`, `certbot`, `html` (page Nginx par défaut) | `ls /var/www` |

## Services

| Service | État | Rôle | Remarques |
|---|---|---|---|
| `nginx` | actif | Reverse proxy, TLS, cache, limites de débit | HSTS, `client_max_body_size 10m`, zones `ak_api` 30 req/min et `ak_login` 5 req/min |
| `pm2-root` / `ahloul-khidma` | actif, 1 instance fork, 8 redémarrages | Next.js sur `127.0.0.1:3000` | Utilisateur root ; `pm2-logrotate` actif |
| `cron` | actif | Sauvegarde 03:00 ; sonde PayDunya à la minute 07 de chaque heure | Voir ci-dessous |
| `certbot.timer` | actif | Renouvellement TLS | Prochain passage le 2026-11-19 |
| `ufw` | actif | Pare-feu : 22, 80, 443 | |
| `monarx-agent` | actif | Sécurité fournie par l'hébergeur | Port local 65529 |
| `fail2ban` | **absent** | — | Voir `AUDIT_SECURITE.md` S3 |
| `unattended-upgrades` | actif | Mises à jour automatiques | Redémarrage encore en attente |

Ports exposés à Internet : **22 (SSH), 80, 443**. Le port 3000 n'écoute qu'en local.

## Certificats TLS

- `ahloulkhidmah.org` : expire le 2027-01-02.
- `ahloulkhitmah.com` : expire le 2026-12-25 (orthographe différente : à confirmer).

## Tâches planifiées (cron root)

| Heure | Commande | Rôle |
|---|---|---|
| 03:00 chaque jour | `deploy/backup.sh` → `/var/backups/ahloul-khidma/backup.log` | Sauvegarde base + photos membres, rétention 14 jours, intégrité vérifiée |
| minute 07 chaque heure | `deploy/check-paydunya.sh` → `/var/log/paydunya-check.log` | Sonde : HTTP 403 = bloqué, autre code = débloqué + fichier `/var/log/paydunya-debloque.flag` |

## Sauvegardes

- Base : `auto-db-AAAAMMJJ-HHMMSS.db` (15 fichiers), dernière `2026-11-18 03:00`, `integrity_check = ok`, 85 adhérents au moment de la copie.
- Photos : `auto-uploads-*.tar.gz` (~16 Mo).
- **Copie externe absente** (`FIREBASE_STORAGE_BUCKET` vide) ; **alerte d'échec silencieuse** (`ALERT_WHATSAPP_NUMBER` vide, jeton WhatsApp invalide).
- **Aucun test de restauration** documenté.

## Journaux

| Journal | Emplacement | Taille | Remarque |
|---|---|---|---|
| Application | `~/.pm2/logs/ahloul-khidma-{out,error}-0*.log` | 112 Ko | Rotation quotidienne ; **lignes sans horodatage** |
| Nginx | `/var/log/nginx/{access,error}.log` | 844 Ko | Source fiable pour les statuts HTTP par heure |
| Sonde PayDunya | `/var/log/paydunya-check.log` | quelques lignes | |
| Sauvegarde | `/var/backups/ahloul-khidma/backup.log` | 12 Ko | |

## Services externes

| Service | Usage | État observé |
|---|---|---|
| PayDunya | Paiement en ligne, IPN | Débloqué depuis 01h07 UTC le 19/11 ; 7 IPN « hash invalide » du 11 au 17/11 |
| WhatsApp Cloud API | Cartes membres, alertes | **Authentication Error** |
| SMTP (`nodemailer`) | E-mails | Variable `SMTP_HOST` définie ; **fonctionnement non testé** |
| Firebase Storage | Sauvegarde externe | Compte de service défini, **bucket non configuré** |
| Wave (numéro d'encaissement) | Secours manuel pendant l'incident | Aucun lien automatique avec les fiches |

## Dépendances entre services

`Visiteur → Nginx → Next.js (PM2) → SQLite` ; `Next.js → PayDunya` (création de facture, confirmation) ; `PayDunya → /api/payments/ipn` (notification) ; `Next.js → WhatsApp / SMTP` (badges, alertes) ; `cron → backup.sh → disque local (+ Firebase si configuré)`.
