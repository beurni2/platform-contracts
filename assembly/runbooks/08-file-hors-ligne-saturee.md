# Runbook 08 — File de preuves hors-ligne saturée
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.scenario = offline_backlog_threshold_exceeded`
(OfflineBacklogMonitor de l'assemblage, `offline-backlog-policy.v1` :
plus de 25 lots en attente, ou le plus ancien au-delà de 30 min).

## Diagnostic
Compter les spines avec `hasPendingOfflineEvidence() = true` et l'âge du
plus ancien lot. Loi hors-ligne du noyau : en attente = en cours, jamais
terminé — aucune validation ne voit un lot avant sa remontée (vérifié en
E2 sur chaque spine).

## Action de reprise
1. Rétablir la connectivité des coursiers concernés (le plus souvent la
   cause réelle), puis vider chaque file par la SEULE sortie qui existe :
   `CustodySpine.flushOfflineEvidence(<maintenant>)` — chaque lot repasse
   par le chemin server_confirmed avec le même parse strict.
2. Vérifier `drained = accepted` et traiter chaque refus individuellement
   (lot corrompu → redemander la preuve).
3. Re-observer la file : vide = plus d'alerte (vérifié en E2).
