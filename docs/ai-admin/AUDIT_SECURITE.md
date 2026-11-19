# AUDIT_SECURITE — Ahloul Khidmah

> Phase 0, lecture seule, 2026-11-19. Aucun secret n'est reproduit ici (seule la présence/absence d'une variable est indiquée).
> Gravité : **Élevée** / **Moyenne** / **Faible**. **[Obs]** vérifié · **[Hyp]** non vérifié.

## Constats

| # | Constat | Preuve | Gravité | Conséquence | Recommandation |
|---|---|---|---|---|---|
| S1 | **Alertes de sauvegarde silencieuses.** `ALERT_WHATSAPP_NUMBER` est vide et le jeton WhatsApp renvoie « Authentication Error » : en cas d'échec de sauvegarde ou de disque plein, personne n'est prévenu. | `.env` (variable absente), `deploy/backup.sh`, journaux `sendAdherentBadgeWhatsApp … Authentication Error` | Élevée | Une panne de sauvegarde peut passer inaperçue des semaines | Renseigner un canal d'alerte qui marche (e-mail SMTP, à vérifier) et renouveler le jeton WhatsApp |
| S2 | **Sauvegardes uniquement sur le même disque.** Pas de copie externe : `FIREBASE_STORAGE_BUCKET` est vide alors que `FIREBASE_SERVICE_ACCOUNT_PATH` est défini. Rétention 14 jours. | `.env`, `deploy/backup.sh`, `/var/backups/ahloul-khidma/` | Élevée | Perte du disque = perte des données et des sauvegardes | Activer la copie hors serveur, tester une restauration |
| S3 | **SSH ouvert aux mots de passe et à root.** `PermitRootLogin yes` et `PasswordAuthentication yes` apparaissent ; une autre ligne dit `no` (valeur effective à confirmer avec `sshd -T`). **fail2ban non installé.** 874 échecs d'authentification dans `auth.log`. | `/etc/ssh/sshd_config*`, `dpkg -l fail2ban`, `/var/log/auth.log` | Élevée | Force brute continue sur le port 22 | Clés SSH seules, `PermitRootLogin prohibit-password`, installer fail2ban |
| S4 | **Application et PM2 exécutés en root.** | `ps -o user= -p <next-server>` = root | Moyenne | Une faille dans l'app donne les droits root | Utilisateur dédié sans privilèges |
| S5 | **Rôle unique, un seul compte admin.** Le middleware n'accepte que `role === "admin"`. | `src/middleware.ts:121`, 1 ligne dans `User` | Moyenne | Pas de séparation des tâches, pas de moindre privilège, compte partagé | Matrice de rôles (voir plan) avant toute action IA |
| S6 | **Journal d'audit incomplet.** 22 types d'actions tracés, mais **pas** le changement de statut d'un adhérent (`PATCH /api/adhesions/[id]`), ni les exports (adhérents, contributions, rapports), ni les connexions. L'audit est modifiable par le code applicatif (simple table). | `src/lib/audit-log.ts`, `grep logAudit` | Moyenne | Actions sensibles sans trace | Étendre la couverture, rendre le journal append-only (hash chaîné) |
| S7 | **Notifications de paiement refusées (7 fois du 11 au 17/11)** : « PayDunya IPN: hash invalide ». Cause non établie. | journaux PM2 | Moyenne | Un paiement réel pourrait ne pas être enregistré | Enquêter : rejouer une notification, vérifier la clé maître, le mode live/test |
| S8 | **Jeton WhatsApp invalide.** Les badges membres ne partent plus. | journaux PM2 (plusieurs occurrences, du 12 au 16/11) | Moyenne | Fonction métier dégradée, alertes impossibles | Renouveler le jeton |
| S9 | **Rate limiting en mémoire.** Réinitialisé au redémarrage ; Nginx ajoute une limite par IP (30 req/min API, 5 req/min login). | `src/lib/rate-limit.ts`, `nginx` `limit_req` | Faible | Protection partielle, contournable par redémarrage | Acceptable en mono-instance ; ne pas s'y fier pour l'IA |
| S10 | **Dépendances** : `npm audit` (prod) = 0 critique, **6 élevées**, 11 modérées, 1 faible. La compilation Next.js affiche aussi un avis de sécurité (contenu non vérifié). | `npm audit --omit=dev` | Moyenne | Surface d'attaque | Passer en revue les 6 élevées ; vérifier l'avis auprès de la source officielle |
| S11 | **Système non à jour** : redémarrage requis, 49 paquets à mettre à jour. | `/var/run/reboot-required`, `apt list --upgradable` | Moyenne | Correctifs noyau non appliqués | Planifier une fenêtre de redémarrage |
| S12 | **Domaine `ahloulkhitmah.com`** (orthographe différente) a un certificat qui expire le 2026-12-25. | `/etc/letsencrypt/live/` | Faible | Renouvellement à vérifier | Confirmer que ce domaine est voulu |
| S13 | **Sondes d'injection SQL** vues dans les journaux (`/brand/logo.png AND 1=1`). Aucune conséquence : requêtes via Prisma, simple 404. | `ahloul-khidma-error-0__2026-11-18*.log` | Faible | Activité malveillante normale | fail2ban + surveillance |

## Points positifs vérifiés

- HTTPS forcé, HSTS 1 an, en-têtes de sécurité (CSP par nonce, X-Frame-Options, nosniff) ; certificat principal valide jusqu'au 2027-01-02.
- Pare-feu `ufw` actif (22, 80, 443) ; l'application n'écoute que sur `127.0.0.1:3000`.
- `.env` en `600`, ignoré par Git, aucun fichier sensible suivi par Git ; dossier `secrets/` en `700`.
- Signature des notifications PayDunya vérifiée à temps constant (`timingSafeEqual`).
- Dernière sauvegarde de la base : `integrity_check = ok`.
- Agent d'hébergeur Monarx actif.

## Exigences de sécurité propres à l'agent IA (à respecter dès la conception)

1. Aucun secret n'est transmis au modèle ; clé du fournisseur côté serveur seulement.
2. Pas de shell ni de SQL arbitraire : uniquement des outils typés (Zod) appelant `src/lib/`.
3. Permissions vérifiées côté serveur à chaque appel d'outil, indépendamment de la réponse du modèle.
4. Les journaux et documents lus par l'IA sont des **données**, jamais des instructions (injection de prompt) : on a vu cette semaine du texte de pile d'erreur et un avis de compilation contenant des consignes.
5. Interrupteur global pour couper l'IA (modèle : `WAVE_FALLBACK_ENABLED`).
