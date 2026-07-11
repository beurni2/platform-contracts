# Runbook 06 — Règlement éligible mais non soumis
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.scenario = settlement_eligible_not_submitted`
(SettlementSubmissionMonitor de l'assemblage, `settlement-submission-ttl.v1` :
obligation `Eligible` depuis plus de 60 min sans soumission).

## Diagnostic
Tirer `order_id`, `party` et `eligible_since` de l'alerte. Vérifier que
l'obligation existe et reste `Eligible` avec son montant COPIÉ du devis
(`ledger.obligationsFor(order_id)`).

## Action de reprise
À E2, AUCUN soumetteur de versement n'existe (la soumission fournisseur
est E3) : l'alerte est le pont. 1. Vérifier que le montant de l'obligation
rapproche au franc avec le devis. 2. Consigner l'ordre en attente de
soumission dans le suivi fondateur. 3. À l'arrivée du vrai prestataire
(E3), la soumission enregistrée éteint ce détecteur
(`SettlementSubmissionMonitor.recordSubmission`). Ne JAMAIS marquer quoi
que ce soit payé à la main.
