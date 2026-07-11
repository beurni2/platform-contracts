# Runbook 05 — Preuve déposée mais non validée
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.scenario = evidence_not_validated_aging`
(OpsMonitor Séra, `ops-aging-policy.v1` : preuve acceptée sans décision de
validation depuis plus de 30 min).

## Diagnostic
Tirer `task_id` et `submitted_at`. Vérifier l'état du spine de garde :
preuve présente (`delivery.evidence_submitted.v1` émis) mais aucune
`ValidationDecision`.

## Action de reprise
1. Exécuter la décision : `CustodySpine.decideValidation(<maintenant>)` —
   la commande réelle, vérifiée en E2 (la reprise du scénario 5 aboutit à
   `validated`).
2. Si la décision aboutit à `review_hold`, suivre la file de revue humaine.
3. Si la décision refuse (preuve incomplète), redemander la preuve au
   coursier — la file hors-ligne peut la retenir : voir runbook 08.
