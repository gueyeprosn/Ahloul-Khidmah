# AUDIT_ARCHITECTURE — Ahloul Khidmah

> Phase 0, lecture seule. Date de l'audit : 2026-11-19. Chaque constat porte sa preuve.
> Légende : **[Obs]** observation vérifiée · **[Hyp]** hypothèse · **[Reco]** recommandation.

## 1. Pile technique (vérifiée)

| Élément | Constat | Preuve |
|---|---|---|
| Framework | Next.js 16.4.3, App Router, React 19.2.4, TypeScript 5 | `package.json`, `src/app/` |
| Groupes de routes | `(dashboard)` = administration, `(marketing)` = site public, `login` | `find src/app -name page.tsx` |
| Données | Prisma 5.22 + **SQLite** (`data/ahloul.db`, ~4,9 Mo avec WAL) | `prisma/schema.prisma`, `du -sh data` |
| Migrations | **Aucun dossier `prisma/migrations`** : le schéma est poussé par `db push` | `ls prisma/migrations` vide, script `db:push` |
| Auth admin | JWT (`jose`) en cookie httpOnly, 7 j, `sessionVersion` pour la révocation, mots de passe `bcryptjs` | `src/lib/auth.ts` |
| Auth membre | Session séparée par PIN (`member-auth`, `member-pin`) | `src/lib/member-*.ts` |
| Paiement | PayDunya (checkout, SoftPay Wave/Orange, IPN signé par hash SHA-512 de la clé maître) | `src/lib/paydunya.ts`, `api/payments/ipn` |
| Messagerie | WhatsApp Cloud API (cartes membres), SMTP via `nodemailer` | `src/lib/whatsapp.ts`, `mail.ts` |
| Sauvegarde externe | `firebase-admin` (script `backup-to-firebase.mjs`) | `deploy/` |
| Tests | Vitest, 13 fichiers, **97 tests** (base de test isolée, garde-fou sur `DATABASE_URL`) | `tests/`, `tests/setup.ts` |
| Taille | 352 fichiers TS/TSX, ~70 routes API, ~60 pages | `find src` |

## 2. Exécution et déploiement

- **[Obs]** Un seul processus PM2 en mode `fork` (1 instance, volontairement : SQLite), `next start -H 127.0.0.1 -p 3000`, derrière Nginx. Il tourne sous l'utilisateur **root**.
- **[Obs]** `next.config.ts` déclare `output: "standalone"` alors que le processus est lancé avec `next start` : Next.js affiche à chaque démarrage « `next start` does not work with `output: standalone` ». Le site fonctionne, mais configuration et commande ne correspondent pas.
- **[Obs]** `deploy/deploy.sh` enchaîne `git pull`, `npm ci`, `npm run build`, `pm2 reload`. Pas d'étape de test, pas de retour arrière automatique, pas de contrôle de santé après rechargement.
- **[Obs]** Le dépôt Git existe mais contient **59 fichiers modifiés non commités** au moment de l'audit (dont les correctifs de paiement de cette semaine).
- **[Reco]** Commiter, ajouter test + contrôle de santé au déploiement, tagguer chaque version déployée.

## 3. Organisation du code

- `src/lib/` : logique métier (adhésions, paiements, cotisations, contributions, badges, boutique, rapports PDF/CSV, audit).
- `src/app/api/` : routes API, protégées par `getSession()` côté route **et** par `src/middleware.ts` (liste blanche d'API publiques).
- `src/features/` : schémas Zod et constantes. `src/components/` : UI (shadcn / Radix).
- **[Obs]** Les routes sans contrôle de session sont toutes dans la liste publique prévue (adhésion, paiement, boutique, connexion, webhooks). Aucune route d'administration sans contrôle n'a été trouvée.

## 4. Données (modèles Prisma)

`User`, `AuditLog`, `Cellule`, `Adherent`, `Cotisation`, `Payment`, `Contribution`, `WalletTransaction`, `Album`, `Photo`, `Testimonial`, boutique (`Category`, `Product`, `ProductImage`, `ProductVariant`, `Order`, `OrderItem`, `InventoryTransaction`, `Coupon`, `CouponClaim`, `CouponUsage`, `Review`, `Collection`, `ProductCollection`).

Volumes réels : 93 adhérents · 14 cellules · 87 cotisations · 288 paiements · 49 contributions · 82 écritures de portefeuille · 1 commande · **1 compte admin** · 48 lignes d'audit.

- **[Obs]** Montants en `Int` (FCFA entiers) : format exact, adapté à XOF, pas de flottants.
- **[Obs]** Aucun modèle de dépense, budget, journal ou compte comptable (voir `AUDIT_FONCTIONNEL.md`).
- **[Hyp]** Sans dossier de migrations, tout changement de schéma lié à l'IA devra passer par `db push` : il faut une sauvegarde vérifiée avant chaque changement.

## 5. Ce qui limite l'ajout d'un centre IA

| Limite | Conséquence |
|---|---|
| Rôle unique `admin` codé en dur (`middleware.ts` refuse tout autre rôle) | Pas de matrice de permissions sans modifier le middleware |
| Rate limiting **en mémoire** par processus | Réinitialisé à chaque rechargement ; inutilisable pour limiter l'IA de façon fiable |
| Pas de file de tâches ni de planificateur applicatif | Les automatisations passent par `cron` hôte ou une table de jobs SQLite |
| SQLite mono-processus | Pas de second worker qui écrit ; l'IA doit passer par l'application existante |
| Pas de point de santé applicatif (`/api/health`) | Aucune sonde propre ; la sonde PayDunya de cette semaine a été écrite à la main |

## 6. Intégrations nécessaires (résumé)

Fournisseur de modèle côté serveur uniquement, registre d'outils typés (Zod) appelant les services `src/lib/`, tables `AI*` + `Approval` + `Incident` + `HealthCheck` dans la base existante, canal d'alerte **fonctionnel** (WhatsApp est cassé, voir `AUDIT_SECURITE.md`). Détail dans `PLAN_INTEGRATION_AI.md`.
