# Ahloul Khidmah — site web de l'association

Site public + espace membre + tableau de bord admin pour l'association
Ahloul Khidmah (Touba, Sénégal) : adhésion en ligne, cotisations, dons,
carte membre avec QR de vérification, WhatsApp, paiements PayDunya.

En production sur `https://www.ahloulkhidmah.org`.

## 1. Présentation

- **Site public** (FR/AR) : présentation, adhésion, don ponctuel (« contribution »),
  médiathèque, témoignages, FAQ.
- **Espace membre** (`/mon-espace`) : téléphone + code PIN (ou, pour un
  compte qui n'a pas encore créé de PIN, les 4 derniers caractères de son
  numéro de badge — voir § 9). Profil, carte membre, historique des
  cotisations, portefeuille, paiement de cotisation en retard.
- **Tableau de bord admin** (`/dashboard`, `/login`) : gestion des
  adhérents, cotisations, contributions, cellules, médias, témoignages,
  rapports (CSV/PDF), inscription manuelle d'un membre (§ 9bis), journal
  d'activité (§ 9ter).
- **Paiement** : PayDunya (Wave / Orange Money), webhook IPN de confirmation.
- **Carte membre** : image PNG générée à la volée (photo, QR, numéro
  d'adhésion), envoyée par WhatsApp et/ou email après paiement.

## 2. Stack technique

| Élément | Valeur |
|---|---|
| Runtime | Node.js 22 |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix/shadcn |
| Langage | TypeScript |
| Base de données | SQLite (fichier unique) via Prisma 5 |
| Process manager | PM2 (`ecosystem.config.cjs`) |
| Reverse proxy | Nginx + Let's Encrypt (SSL) |
| Paiement | PayDunya (checkout, SoftPay Wave/Orange, IPN) |
| Messagerie | WhatsApp Cloud API (Meta), email SMTP (Nodemailer) |
| Génération d'image | `@napi-rs/canvas` (badge), `qrcode` (QR) |

## 3. Installation locale (développement)

```bash
npm ci
cp .env.example .env   # puis remplir les valeurs — voir § 4
mkdir -p data
npx prisma db push     # crée les tables SQLite à partir de prisma/schema.prisma
npm run dev
```

Scripts utiles (`package.json`) :

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement (`next dev`) |
| `npm run build` | `prisma generate` + build de production |
| `npm start` | Démarre le build de production sur le port 3000 |
| `npm run lint` | ESLint |
| `npm run deploy` | Raccourci vers `deploy/deploy.sh` |
| `npm run db:push` | Applique `prisma/schema.prisma` à la base (sans migration versionnée) |
| `npm run db:seed` | Rejoue `prisma/seed.ts` (données de départ) |

## 4. Variables d'environnement

**Ce tableau ne liste que les NOMS des variables — jamais leurs valeurs.**
Le fichier `.env` réel (sur le serveur, jamais commité) contient les
valeurs ; ne jamais les copier dans ce document, un commit, ou un message.

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chemin du fichier SQLite (`file:...`) |
| `AUTH_SECRET` | Secret de signature des sessions admin (JWT) — 32+ caractères |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` | Compte admin créé par `prisma/seed.ts` |
| `ALLOW_INSECURE_COOKIES`, `COOKIE_SECURE` | Contrôle du flag `Secure` des cookies (désactivé seulement en dev local sans HTTPS) |
| `NEXT_PUBLIC_SITE_URL` | Origine publique du site (liens WhatsApp/email, QR) |
| `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_PUBLIC_KEY`, `PAYDUNYA_TOKEN` | Identifiants API PayDunya |
| `PAYDUNYA_MODE` | `test` ou `live` |
| `PAYDUNYA_STORE_NAME`, `PAYDUNYA_STORE_ADDRESS`, `PAYDUNYA_STORE_PHONE`, `PAYDUNYA_STORE_TAGLINE` | Informations boutique affichées sur la page de paiement PayDunya |
| `WHATSAPP_TOKEN` | Jeton d'accès WhatsApp Cloud API (envoi de messages/médias) |
| `WHATSAPP_PHONE_NUMBER_ID` | ID du numéro WhatsApp Business |
| `WHATSAPP_API_VERSION` | Version de l'API Graph Meta (ex. `v21.0`) |
| `WHATSAPP_VERIFY_TOKEN` | Vérification du webhook (handshake `hub.challenge`) — **configuré** |
| `WHATSAPP_APP_SECRET` | Vérifie la signature des notifications entrantes du webhook — **non configuré actuellement, voir § 8** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Envoi d'email (Gmail par défaut) — **`SMTP_PASS` non configuré actuellement, voir § 8** |
| `MAIL_FROM` | Adresse d'expédition affichée |
| `ALERT_WHATSAPP_NUMBER` | Numéro WhatsApp qui reçoit les alertes techniques (sauvegarde échouée, disque plein) — voir § 6 |
| `FIREBASE_STORAGE_BUCKET` | Bucket Firebase Storage pour la copie de sauvegarde hors-serveur — **vide actuellement (mis en pause volontairement, voir § 6)** |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Chemin vers le fichier de compte de service Firebase (le fichier lui-même est secret, déjà en place — voir § 6) |

## 5. Base de données

SQLite, **un seul fichier** (`data/ahloul.db`), accédé via Prisma
(`prisma/schema.prisma`). Un point important : SQLite ne gère bien qu'un
seul processus qui écrit à la fois — PM2 tourne donc en **mode fork, une
seule instance** (voir `ecosystem.config.cjs`), jamais en cluster.

Tables principales : `User` (admins), `Adherent` (membres), `Cellule`,
`Cotisation`, `Payment`, `Contribution` (dons), `WalletTransaction`,
`Album`/`Photo` (médiathèque), `Testimonial`.

Modifier le schéma :
```bash
# Édite prisma/schema.prisma, puis :
npx prisma db push        # applique à la base (ajoute/modifie les colonnes)
npx prisma generate       # régénère le client TypeScript
```
**Toujours faire une sauvegarde avant un changement de schéma en
production** (voir § 6) — `db push` peut demander `--accept-data-loss`
pour certains changements ; dans ce cas, confirmer explicitement qu'on
comprend ce qui sera perdu avant de l'ajouter.

## 6. Sauvegarde et restauration

**Automatique** : `deploy/backup.sh`, lancé chaque nuit à 3h par une tâche
planifiée (`crontab -l` pour la voir). Il copie la base (méthode `.backup`
de SQLite — cohérente même si le site écrit en même temps) et les photos
de `public/uploads/`, vérifie l'intégrité de la copie, garde 14 jours
d'historique, et envoie une alerte WhatsApp à `ALERT_WHATSAPP_NUMBER` si
quelque chose échoue ou si le disque dépasse 85% — silencieux sinon.
Journal : `/var/backups/ahloul-khidma/backup.log`.

Sauvegarde manuelle immédiate : `bash deploy/backup.sh`.

Tout est stocké dans `/var/backups/ahloul-khidma/` (hors du dossier du
projet).

**Copie hors du serveur (Firebase Storage)** : après la sauvegarde locale,
`deploy/backup-to-firebase.mjs` peut envoyer une copie de la base vers
Firebase Storage — silencieux si `FIREBASE_STORAGE_BUCKET` /
`FIREBASE_SERVICE_ACCOUNT_PATH` ne sont pas configurés, et sans jamais
bloquer la sauvegarde locale en cas d'échec.

**Statut actuel : mise en pause volontairement** (`FIREBASE_STORAGE_BUCKET`
vide dans `.env`) — Firebase Storage nécessite un compte de facturation
(plan Blaze), mise en attente d'une décision. Le fichier de compte de
service est déjà en place (`secrets/firebase-service-account.json`,
permissions restreintes) : pour activer, il suffit de renseigner
`FIREBASE_STORAGE_BUCKET="ahloulkhidmah-adc28.firebasestorage.app"` dans
`.env` une fois Storage activé dans la console Firebase du projet.

**Restaurer :**
```bash
cp /var/backups/ahloul-khidma/auto-db-<date>.db data/ahloul.db
tar -xzf /var/backups/ahloul-khidma/auto-uploads-<date>.tar.gz -C public/
pm2 restart ahloul-khidma
```

## 7. Déploiement

```bash
bash deploy/deploy.sh
```
Ce script : `npm ci`, build de production, puis recharge PM2
(`pm2 reload` s'il tourne déjà, sinon `pm2 start`). Nginx sert de reverse
proxy HTTPS vers `127.0.0.1:3000` (config : `deploy/nginx.ahloul-khidma.conf`).

Vérifier après déploiement :
```bash
pm2 status
pm2 logs ahloul-khidma --lines 20
curl -s -o /dev/null -w "%{http_code}\n" https://www.ahloulkhidmah.org/
```

## 8. Ce qui reste à finaliser (configuration, pas du code)

- **WhatsApp Cloud API** : `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` —
  **configurés**, l'envoi automatique du badge par WhatsApp est
  opérationnel.
- **Webhook WhatsApp** : `WHATSAPP_APP_SECRET` — **non configuré**,
  trouvable dans https://developers.facebook.com/apps/ → l'app liée au
  numéro WhatsApp Business → Paramètres → Général → « Clé secrète de
  l'app ». Sans cette valeur, le webhook reste accepté sans vérification
  de signature — sans conséquence tant qu'il ne fait qu'enregistrer des
  logs.
- **Email** : `SMTP_PASS` — **non configuré**, nécessite un « mot de passe
  d'application » Gmail (pas le mot de passe habituel du compte), généré
  sur https://myaccount.google.com/apppasswords. Sans cette valeur, le
  badge par email n'est simplement pas envoyé.
- **Copie de sauvegarde Firebase** — **en pause volontairement**, voir § 6.

Comme toujours : aucune valeur secrète n'est jamais saisie par un
assistant automatisé — seulement préparée en configuration, à renseigner
par un humain.

## 9. Authentification

- **Admin** (`/login`) : email + mot de passe (bcrypt), session JWT
  (cookie `ak_session`). Un changement de mot de passe incrémente
  `sessionVersion`, ce qui invalide immédiatement toute session ouverte
  ailleurs.
- **Membre** (`/mon-espace`) : téléphone + code PIN (4 chiffres, choisi par
  le membre, bcrypt) si défini. Sinon, repli sur les 4 derniers caractères
  du numéro de badge — un ancien mode d'accès conservé pour ne pas
  bloquer les membres n'ayant pas encore créé de PIN, mais qui n'est
  **pas un vrai secret** (visible sur la carte/QR). Le tableau de bord
  admin (fiche adhérent, liste) affiche qui a défini un PIN, avec une
  action pour le réinitialiser en cas d'oubli.

## 9bis. Inscription manuelle d'un membre (admin)

`/adherents/nouveau` — fiche complète remplie par l'admin (ex. membre payé
en espèces via une cellule locale). Le compte est créé **actif
immédiatement**, sans paiement en ligne, et le badge est généré dans la
foulée sur l'écran de succès.

**Limite connue** : le canal de paiement est toujours enregistré comme
`"cellule"` pour une inscription créée par ce formulaire, quelle que soit
la situation réelle — ça peut fausser la répartition « en ligne vs
espèces » affichée sur le tableau de bord pour ces inscriptions
spécifiques. Pas corrigé à ce jour (signalé, pas encore priorisé).

## 9ter. Journal d'activité

`/journal` — historique des actions admin sensibles : création/activation/
désactivation d'un compte admin, cotisation enregistrée ou annulée,
statut d'un don modifié, profil admin modifié. Table `AuditLog` (Prisma),
écrite via `src/lib/audit-log.ts` (`logAudit(...)`) — une erreur
d'écriture du journal n'annule jamais l'action métier elle-même.

N'enregistre pas (volontairement, pour rester ciblé sur les actions
sensibles) : consultation de fiches, création/modification d'un adhérent
par le formulaire public, envoi de badge.

## 10. Carte membre (badge)

**Architecture figée depuis la dernière validation visuelle — ne pas
modifier le design, les dimensions (680×1080) ou le positionnement sans
repasser par une revue explicite.**

- `src/lib/member-badge.ts` — type des données, dimensions.
- `src/lib/member-badge-design.ts` — constantes graphiques partagées
  (couleurs, polices, disposition).
- `src/lib/member-badge-draw.ts` — composition partagée serveur/client.
- `src/lib/member-badge-server.ts` — rendu `@napi-rs/canvas` (WhatsApp,
  email, aperçu admin).
- `src/lib/member-badge-client.ts` — rendu navigateur (aperçu, téléchargement).
- `src/lib/send-member-badge.ts` / `send-member-email.ts` — envoi après paiement.

La carte est **toujours régénérée par le serveur** à partir des données
réelles du membre au moment de l'envoi WhatsApp (jamais reçue depuis le
navigateur) — voir la remédiation sécurité de septembre 2026.

## 11. QR / validation

`/valider/{id}` (page publique, sans connexion, visée par le QR de la
carte) répond uniquement à « cette carte est-elle valide ? » : statut,
nom, numéro de membre, date d'adhésion. Volontairement minimal depuis la
remédiation sécurité — ne jamais y ajouter téléphone, cellule, région,
profession ou montant de cotisation (voir commentaire dans
`src/components/adhesion/validation-client.tsx`).

## 11bis. Résilience après déploiement

À chaque déploiement, les fichiers JS changent de nom — un onglet resté
ouvert depuis avant le déploiement peut essayer de charger un ancien
fichier qui n'existe plus (page blanche, « This page couldn't load »).
Deux filets de sécurité, actifs sur tout le site public :

- `src/components/chunk-error-reload.tsx` — détecte ce cas précis et
  recharge automatiquement la page une seule fois (pas de boucle).
- `src/app/global-error.tsx` — écran de secours générique si une erreur
  imprévue survient malgré tout (le site public n'en avait aucun avant).

## 12. Architecture des dossiers

```
src/
├── app/
│   ├── (marketing)/     pages publiques (accueil, adhésion, contribuer, valider, mon-espace...)
│   ├── (dashboard)/     admin (adherents, cotisations, rapports...)
│   └── api/             routes API (paiements, whatsapp, mon-espace, adherents...)
├── components/          composants React par domaine
├── lib/                 logique métier (auth, paiements, badge, whatsapp, mail...)
├── features/            schémas de validation (zod) par fonctionnalité
├── i18n/                dictionnaires FR/AR
└── middleware.ts         protection des pages/API admin
prisma/schema.prisma      schéma de base de données
deploy/                   scripts d'exploitation (deploy, backup, backup-to-firebase, nginx, setup VPS)
secrets/                  fichiers secrets déposés manuellement (compte de service Firebase) — permissions restreintes, jamais dans le code
```

## 13. Sécurité — historique des remédiations (septembre 2026)

Un audit de sécurité complet a été mené, suivi de corrections appliquées
une par une (voir historique de conversation pour le détail de chaque
étape) :
- Sauvegarde automatique quotidienne + alerte (§ 6).
- PIN membre obligatoire en cours de généralisation (accès par suffixe de
  badge conservé en transition, voir § 9).
- Page `/valider` réduite au strict nécessaire (§ 11).
- `send-card` WhatsApp : anti-spam + régénération serveur de l'image (§ 10).
- Checkout de cotisation/don : **volontairement laissé ouvert à tous**
  (décision produit assumée — payer pour un autre membre ne fait que
  créditer sa cotisation, ce n'est pas un risque).
- SMTP et webhook WhatsApp : en attente de configuration (§ 8).

**Audit du tableau de bord (suite, même mois)** :
- Journal d'activité admin ajouté (§ 9ter) ; `/journal` manquait de la
  protection middleware (corrigé — il ne dépendait que du contrôle de
  session du layout, qui fonctionnait déjà correctement).
- Bug corrigé : le bouton « Réessayer » de la page d'erreur admin
  utilisait un nom de propriété obsolète (`reset` au lieu de `retry` —
  spécifique à cette version de Next.js) et ne fonctionnait pas
  réellement.
- **Numéro de membre / cellule — collision corrigée** : deux inscriptions
  arrivant en même temps (ex. paiement en ligne confirmé pendant qu'un
  admin inscrit quelqu'un manuellement) pouvaient se marcher dessus,
  faisant échouer l'une des deux avec une erreur serveur brute — pour un
  paiement en ligne, l'argent restait encaissé sans fiche membre créée.
  Nouvelle tentative automatique en cas de collision (`src/lib/adherents.ts`),
  et un paiement resté bloqué peut désormais être rattrapé automatiquement
  (`src/lib/payments.ts`). Trois paiements PayDunya réellement bloqués par
  ce bug avant correction (4 200 FCFA) ont été réconciliés manuellement en
  dons généraux, traçables (voir Journal d'activité).
- Résilience après déploiement ajoutée (§ 11bis).
