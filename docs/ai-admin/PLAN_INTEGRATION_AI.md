# PLAN_INTEGRATION_AI — Architecture cible et backlog (périmètre resserré)

> Version 2 du 2026-11-19, resserrée après l'audit de la Phase 0. **Rien n'a été modifié en production** pour ce plan. Ce document propose ; la direction décide.
> Changement par rapport à la version 1 : de 8 agents à **3 agents livrés d'abord**, un 4e conditionnel, le reste repoussé.

## 1. Périmètre

| Rang | Agent | Rôle | Nature |
|---|---|---|---|
| A | **Supervision et incidents** | Détecte, alerte, diagnostique, rédige le rapport d'incident | Règles fixes pour détecter ; IA pour expliquer |
| B | **Administratif** | Adhésions, fiches incomplètes, cellules, paiements hors ligne à rapprocher | Lecture + tâches proposées |
| C | **Briefing exécutif** | Briefing quotidien, rapport hebdomadaire | Lecture seule, réutilise A et B |
| D | **Finance** (conditionnel) | État clair confirmé / en attente / non rapproché, anomalies par règles fixes | Lecture seule |

**Repoussés, avec condition de réouverture :**

| Élément | Raison | Condition |
|---|---|---|
| Comptable (partie double, plan comptable, états) | Dépend du statut juridique (OHADA/SYCEBNL) et d'un comptable agréé | Statut juridique confirmé + besoin exprimé par un comptable |
| Opérations (projets, tâches d'équipe) | Aucune donnée de projet à exploiter | Utilisation réelle d'un suivi de tâches pendant ≥ 1 mois |
| Développeur dans l'application | Risque le plus élevé : modifier la production depuis un chat | Jamais en direct. L'IA **propose** un correctif ; un humain relit, teste, déploie via Git |
| Dépenses et budgets | Modules absents ; pas de besoin documenté | Décision de la direction après l'agent D |

## 2. Principes

1. Construire dans l'application existante (Next.js + Prisma/SQLite + PM2) : pas de nouvelle base, pas de Docker, pas de file de messages.
2. L'IA n'a aucun accès direct à la base ni au système. Elle appelle des **outils typés** qui réutilisent `src/lib/`.
3. **La détection ne dépend jamais du modèle** : sondes et seuils fixes, sans IA. L'IA n'intervient qu'après, pour expliquer.
4. L'IA n'est jamais la source de vérité : chaque réponse cite l'outil et la requête qui l'ont produite. Donnée absente = « indisponible », jamais une estimation présentée comme un fait.
5. Première version : **lecture seule + alertes**. Toute écriture passe par une approbation humaine.
6. Interrupteur global `AI_ENABLED` (même principe que `WAVE_FALLBACK_ENABLED`).
7. Le contenu externe (journaux, messages, noms) est une **donnée**, jamais une instruction.

## 3. Architecture cible

```
Navigateur (/admin/ai-center, session admin existante)
        │  HTTPS, cookie httpOnly
Next.js (PM2, 1 instance)
 ├─ API /api/ai/*  ── session + rôle + quota + interrupteur AI_ENABLED
 ├─ Orchestrateur  ── choisit l'agent (A, B, C, D), appelle le fournisseur de modèle (clé côté serveur)
 ├─ Registre d'outils (Zod : entrée, sortie, rôle, risque, limite) ── appelle src/lib/*
 ├─ Approbations   ── table AIActionApproval (écritures uniquement)
 └─ Audit          ── AuditLog étendu (append-only, chaîne de hachage), identifiant de corrélation
SQLite (même base) : tables AI*, SystemIncident, SystemHealthCheck, AdminTask
cron hôte : sondes (santé, sauvegarde, paiements) → SystemHealthCheck → SystemIncident → alerte
```

Un seul orchestrateur ; les agents sont des **jeux d'outils et de consignes**, pas des processus.

## 4. Outils par agent (lecture seule d'abord)

| Agent | Outils |
|---|---|
| A — Supervision | `get_system_health`, `get_api_health`, `get_recent_errors`, `search_application_logs`, `get_backup_status`, `get_payment_provider_status`, `create_incident`, `update_incident`, `generate_incident_report` |
| B — Administratif | `get_members_summary`, `list_incomplete_profiles`, `get_cell_statistics`, `list_offline_payments_to_reconcile`, `get_administrative_anomalies`, `create_administrative_task` *(écriture : approbation)* |
| C — Briefing | `generate_daily_briefing`, `generate_weekly_report` (assemblent les sorties de A et B) |
| D — Finance *(conditionnel)* | `get_financial_overview`, `get_unreconciled_transactions`, `get_financial_anomalies` (vocabulaire « anomalie », jamais « fraude ») |

Chaque outil définit : schéma d'entrée et de sortie, rôle requis, niveau de risque, limites (volume, durée), comportement en cas d'erreur, ligne d'audit. Aucun shell, aucun SQL libre.

## 5. Rôles (matrice réduite, à valider)

| Rôle | Agents accessibles | Peut approuver |
|---|---|---|
| Super Admin | A, B, C, D | tout, sauf ses propres demandes |
| Administrateur technique | A, C | actions techniques |
| Responsable administratif | B, C | statut des adhésions, tâches |
| Consultation seule | C | — |
| Responsable financier *(avec D)* | D, C | rapprochements |

`src/middleware.ts` n'accepte aujourd'hui que le rôle `admin` : à généraliser **avant** d'ouvrir l'IA à d'autres personnes.

## 6. Données à ajouter

Enrichir `AuditLog` (acteur IA ou humain, corrélation, empreinte chaînée). Nouvelles tables : `AIConversation`, `AIMessage`, `AIToolExecution`, `AIActionApproval`, `SystemIncident`, `SystemHealthCheck`, `AdminTask`. Rien pour la comptabilité tant qu'elle est repoussée. Montants en entiers XOF. Sauvegarde vérifiée avant chaque `db push`.

## 7. Prérequis (avant tout agent)

| ID | Prérequis | Pourquoi |
|---|---|---|
| P1 | Canal d'alerte qui fonctionne (e-mail testé, ou jeton WhatsApp renouvelé) | Sans lui, l'agent A ne peut alerter personne |
| P2 | Copie externe des sauvegardes + test de restauration | Filet de sécurité avant toute écriture |
| P3 | Commiter l'état actuel (59 fichiers modifiés) | Retour arrière possible |
| P4 | Un compte par personne | Traçabilité, séparation des tâches |
| P5 | Enquête sur les 7 notifications « hash invalide » | Fiabilité des chiffres de paiement |

## 8. Backlog priorisé

« Dép. » = dépend de. Chaque élément n'est « terminé » qu'avec ses tests.

### Socle (P0)

| ID | Élément | Dép. | Critères d'acceptation |
|---|---|---|---|
| B1 | Prérequis P1–P5 | — | E-mail d'alerte reçu lors d'un test ; une sauvegarde restaurée sur une base vierge ; arbre Git propre ; ≥ 2 comptes admin nominatifs ; cause des « hash invalide » établie |
| B2 | Durcissement serveur : fail2ban, SSH par clés, application non-root, mises à jour + redémarrage planifié | — | `sshd -T` confirme l'état voulu ; fail2ban actif ; application sans privilèges root ; site 200 après redémarrage. **Accord explicite avant** (touche l'accès SSH) |
| B3 | `GET /api/health` (base, mémoire, disque, fraîcheur de la dernière sauvegarde, PayDunya) | — | 200/503 avec détail ; aucun secret exposé ; testé |
| B4 | `SystemHealthCheck` + `SystemIncident` + sonde cron (généralise `check-paydunya.sh`) | B1, B3 | Panne simulée → incident P2 + alerte reçue en < 10 min ; reprise → incident résolu |
| B5 | Étendre l'audit : statut adhérent, exports, connexions ; journal append-only | — | Chaque action listée crée une ligne ; modification détectée par la chaîne de hachage |
| B6 | Généraliser les rôles (middleware, `ALLOWED_ROLES`, contrôle par route) | B5 | Tests de permissions par rôle ; compte `admin` actuel inchangé |

### Agent A — Supervision et incidents

| ID | Élément | Dép. | Critères d'acceptation |
|---|---|---|---|
| B7 | Squelette IA : `AI_ENABLED`, registre d'outils, audit des appels, quotas, plafond de coût | B5, B6 | Outil sans permission refusé et journalisé ; l'interrupteur coupe tout ; aucun secret dans le contexte ; test d'injection de prompt |
| B8 | Outils A en lecture seule + chat `/admin/ai-center` + centre d'incidents | B4, B7 | « Pourquoi les paiements échouent ? » renvoie les faits des journaux avec leur source ; jamais d'état inventé ; rapport post-incident généré |

### Agent B — Administratif

| ID | Élément | Dép. | Critères d'acceptation |
|---|---|---|---|
| B9 | File « paiements hors ligne à rapprocher » (ex. Wave) avec statuts confirmé / en attente / non rapproché | B6 | Paiement associé à une fiche en 2 clics, journalisé ; aucun doublon sur relance |
| B10 | Outils B + centre d'approbation léger (tâches, changement de statut) | B8, B9 | Écriture IA impossible sans approbation ; résultats exacts par rapport à la base (jeu de données de test) |

### Agent C — Briefing exécutif

| ID | Élément | Dép. | Critères d'acceptation |
|---|---|---|---|
| B11 | Briefing quotidien et rapport hebdomadaire envoyés par le canal d'alerte | B8, B10 | Chiffres identiques à la base ; sources citées ; tâche planifiée désactivable et idempotente |

### Validation et déploiement

| ID | Élément | Dép. | Critères d'acceptation |
|---|---|---|---|
| B12 | Tests de sécurité et de non-régression, audit final | B11 | Aucune action sensible sans autorisation ; aucune fuite de secret ; site public inchangé |
| B13 | Déploiement progressif : d'abord un seul administrateur, puis les autres rôles | B12 | Interrupteur testé ; retour arrière documenté et essayé |

### Conditionnel et repoussé

| ID | Élément | Dép. | Critères d'acceptation |
|---|---|---|---|
| B14 | Agent D — Finance en lecture seule | B9, B13 | Chaque montant classé confirmé / en attente / non rapproché ; règles d'anomalies testées (doublons, paiements sans jeton, notifications refusées) |
| — | Dépenses, budgets, comptabilité, opérations, développeur dans l'application | voir §1 | Réouverture sur décision de la direction |

## 9. Phases

0. **Audit** (terminé). 1. **Socle** : B1–B6. 2. **Agent A** : B7–B8. 3. **Agent B** : B9–B10. 4. **Agent C** : B11. 5. **Validation et déploiement** : B12–B13. 6. **Agent D** si la direction le confirme : B14.

## 10. Décisions attendues de la direction

1. Valider ce périmètre à 3 agents + 1 conditionnel.
2. Valider la matrice de rôles et les personnes concernées.
3. Choisir le canal d'alerte (e-mail, WhatsApp, autre) et les destinataires.
4. Choisir le fournisseur du modèle et le plafond de dépense mensuel.
5. Autoriser (ou non) le durcissement du serveur (B2), qui touche l'accès SSH.
6. Confirmer le **statut juridique** : il ne bloque pas les agents A à C, mais conditionne la comptabilité.
