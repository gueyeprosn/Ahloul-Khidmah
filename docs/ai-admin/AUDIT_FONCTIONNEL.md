# AUDIT_FONCTIONNEL — Ahloul Khidmah

> Phase 0, 2026-11-19. Un module n'est « existant » que si du code **et** des données le prouvent.

## Classement des modules

| Module | Statut | Preuve | Remarques |
|---|---|---|---|
| Administration générale (tableau de bord, paramètres, journal) | Existant et fonctionnel | pages `dashboard`, `parametres`, `journal`; 48 lignes d'audit | Indicateurs surtout compteurs ; pas d'indicateurs techniques |
| Utilisateurs et rôles | **Existant mais incomplet** | 1 compte, rôle unique `admin` | Pas de matrice de rôles ; middleware codé sur `admin` |
| Membres et adhésions | Existant et fonctionnel | 93 adhérents, API `adhesions`, `adherents` | Fiches « à compléter » (`ficheComplete=false`) fréquentes ; secours Wave ajouté cette semaine (désactivé par défaut) |
| Cellules et structures | Existant et fonctionnel | 14 cellules, page `cellules` | Rapports de cellule : `rapports/collectes` (à vérifier en usage) |
| Cotisations | Existant et fonctionnel | 87 lignes `Cotisation`, 4 paiements « cotisation » payés | Usage faible côté paiement en ligne |
| Contributions et dons | Existant et fonctionnel | 49 contributions, API `contributions` | Export CSV présent |
| Transactions (paiements) | **Existant mais incomplet** | 288 `Payment` : 102 payés, 186 en attente, dont **51 sans jeton** (jamais facturés) | Pas de rapprochement ; en attente = « non confirmé », pas « dû » |
| Portefeuille | À vérifier | 82 `WalletTransaction` pour 102 paiements « completed » | Écart à expliquer avant tout rapport financier |
| Dépenses | **Absent** | aucun modèle ni code `depense/expense` | À créer |
| Budgets | **Absent** | aucun modèle ni code | À créer |
| Comptabilité (plan, journaux, écritures, balance) | **Absent** | aucun modèle ni code | Dépend du statut juridique (voir informations manquantes) |
| Rapprochement bancaire / Mobile Money | **Absent** | aucun code | Un virement Wave reçu sur un numéro n'est relié à aucune fiche automatiquement |
| Projets et activités | **Absent** (à vérifier) | `competences`, `rapports` existent, pas de projet/tâche | |
| Documents | **Absent** | médias/albums = photos publiques uniquement | |
| Tâches administratives | **Absent** | aucun modèle | |
| Notifications | **Présent mais défaillant** | WhatsApp : « Authentication Error » ; SMTP : défini, **fonctionnement non testé** | Aucun canal d'alerte fiable aujourd'hui |
| Rapports | Existant et fonctionnel | `rapports` (PDF, CSV, périodes), `rapports/detail` | Pas de rapport financier au sens comptable |
| Boutique | Existant mais peu utilisé | 1 commande | Catalogue, stock, coupons, avis présents |
| Supervision / incidents | **Absent** | pas de `/api/health`, pas de table d'incidents | Sondes ad hoc créées cette semaine (`deploy/check-paydunya.sh`) |
| Journal d'audit | **Existant mais incomplet** | voir `AUDIT_SECURITE.md` S6 | |

## Enseignements de l'incident PayDunya (18–19/11/2026)

Faits établis, dates en UTC :

- Le serveur a été bloqué par la protection Cloudflare de PayDunya (HTTP 403 HTML) depuis l'adresse IPv6 `2a02:4780:79:122::1`. Le déblocage est constaté à 01h07 le 19/11 (dernière sonde bloquée à 00h07). Début exact du blocage : **non déterminé** (les lignes du journal d'erreurs PM2 n'ont pas d'horodatage ; les premières mesures horodatées datent du 18/11 à 19h59).
- Aucun outil n'a alerté : la panne a été signalée par un visiteur. Les erreurs ressortaient en « Erreur serveur » (HTTP 500) car la réponse HTML n'était pas gérée.
- Les paiements « en attente » se sont accumulés sans suivi (51 sans jeton).
- La relance a exigé du travail manuel : sonde horaire écrite à la main, mode de secours Wave, rapprochement des 8 membres inscrits sans paiement en ligne.

Capacités que le centre IA devait apporter dans cet incident : détection automatique (sonde + seuil), incident P2 ouvert avec preuves (code HTTP, Ray ID, IP), message utilisateur propre, file de rapprochement des paiements hors ligne, rapport post-incident généré.

## Informations manquantes (à fournir par la direction)

1. **Statut juridique** d'Ahloul Khidmah (association, ONG, autre) : conditionne OHADA/SYSCOHADA ou SYCEBNL. Rien ne sera choisi sans cette réponse.
2. Qui sont les futurs rôles (responsable financier, comptable, auditeur…) et qui approuve quoi.
3. Comptes d'encaissement réels (numéro Wave, Orange Money, banque) et qui les consulte.
4. Existence d'un exercice comptable, d'un budget annuel, de justificatifs numérisés.
5. Canal d'alerte voulu (e-mail, WhatsApp, autre) et personne(s) à prévenir.
