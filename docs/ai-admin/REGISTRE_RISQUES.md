# REGISTRE_RISQUES — Ahloul Khidmah AI Admin

> Probabilité (P) et impact (I) : 1 faible … 3 élevé. Score = P × I. Mis à jour : 2026-11-19.

## A. Risques existants (indépendants de l'IA)

| ID | Risque | P | I | Score | Mitigation proposée | Réf. |
|---|---|---|---|---|---|---|
| R1 | Perte de données : sauvegardes sur le même disque, sans copie externe ni test de restauration | 2 | 3 | 6 | Copie externe, test de restauration trimestriel | S2 |
| R2 | Panne de sauvegarde non détectée (alerte muette) | 3 | 3 | 9 | Canal d'alerte fonctionnel + sonde de fraîcheur des sauvegardes | S1 |
| R3 | Prise de contrôle du serveur par force brute SSH | 2 | 3 | 6 | Clés SSH seules, fail2ban, utilisateur non-root | S3 |
| R4 | Panne d'un prestataire de paiement sans détection ni procédure (vécu : PayDunya) | 3 | 2 | 6 | Sondes, incident P2, procédure de secours (interrupteur) | AUDIT_FONCTIONNEL |
| R5 | Paiement réel non enregistré (IPN refusées) | 2 | 3 | 6 | Enquête IPN, file de rapprochement | S7 |
| R6 | Confusion « en attente » / « dû » dans les chiffres (51 paiements en attente sans jeton) | 3 | 2 | 6 | Statuts financiers distincts : confirmé / en attente / estimé / non rapproché | AUDIT_FONCTIONNEL |
| R7 | Compte admin unique et partagé : pas de traçabilité individuelle | 3 | 2 | 6 | Un compte par personne + rôles | S5 |
| R8 | Dépendances vulnérables (6 élevées) | 2 | 2 | 4 | Revue et mises à jour testées | S10 |
| R9 | Changement de schéma sans migration versionnée | 2 | 2 | 4 | Sauvegarde avant `db push`, puis migrations Prisma | ARCHITECTURE §4 |

## B. Risques propres à l'agent IA

| ID | Risque | P | I | Score | Mitigation |
|---|---|---|---|---|---|
| R10 | L'IA exécute une action sensible sans approbation (finance, droits, code, infra) | 2 | 3 | 6 | Aucun outil d'écriture sans passage par la table d'approbation ; contrôle côté serveur, pas dans le prompt ; tests dédiés |
| R11 | Injection de prompt via journaux, documents, noms de membres, messages WhatsApp | 3 | 3 | 9 | Contenu externe encadré comme donnée, jamais exécuté ; outils à paramètres validés ; aucun shell ni SQL libre ; test d'injection en CI |
| R12 | Fuite de données personnelles ou financières vers le fournisseur du modèle | 2 | 3 | 6 | Minimisation et masquage (numéros, noms) ; accord de traitement ; liste des champs autorisés par outil |
| R13 | Réponse inventée présentée comme un fait (montant, état de service) | 2 | 3 | 6 | Chaque réponse cite l'outil et la requête source ; « donnée indisponible » plutôt qu'estimation |
| R14 | Doublon financier causé par une relance d'outil | 2 | 3 | 6 | Clés d'idempotence sur toute écriture ; écriture validée jamais effacée (contrepassation) |
| R15 | Choix d'un référentiel comptable inadapté (OHADA/SYSCOHADA vs SYCEBNL) | 2 | 3 | 6 | Ne rien choisir avant confirmation du statut juridique ; validation par un comptable agréé |
| R16 | Dérive de coût du fournisseur d'IA | 2 | 2 | 4 | Plafond mensuel, quotas par rôle, journal des tokens |
| R17 | Dépendance à un seul processus Node/SQLite : une tâche IA longue dégrade le site public | 2 | 2 | 4 | Tâches courtes, hors heures de pointe, jamais de requête lourde sans limite |
| R18 | Automatisations activées sans validation (impacts, fréquence, permissions) | 2 | 2 | 4 | Désactivées par défaut ; chaque automatisation approuvée individuellement |
| R19 | Conclusion accusatoire d'un module de détection de fraude | 1 | 3 | 3 | Vocabulaire « anomalie » ; preuves + vérification humaine obligatoire avant toute conclusion |
| R20 | Impossible de couper l'IA vite en cas de problème | 1 | 3 | 3 | Interrupteur global d'environnement (modèle `WAVE_FALLBACK_ENABLED`) + rôle « consultation seule » |

## Principe de revue

Réévaluer ce registre à la fin de chaque phase. Tout risque de score ≥ 6 doit avoir un responsable et une échéance avant d'ouvrir la phase suivante.
