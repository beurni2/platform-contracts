# Runbook 07 — Versement soumis mais non rapproché
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.scenario = payout_not_reconciled`
(PayoutReconciliationMonitor de l'assemblage : un `payout.submitted.v1`
sans `payout.paid.v1` rapprochant, ou un montant qui diverge de
l'obligation).

## Diagnostic
Tirer `collect_ref` et `divergences` de l'alerte. Comparer les événements
de versement du prestataire avec l'obligation correspondante
(`ledger.obligationsFor(order_id)` — le montant de référence, copié du
devis immuable).

## Action de reprise
1. Interroger le prestataire (sandbox : le plan de livraison des webhooks
   du mock certifié ; réel à E3 : l'interface autoritaire du prestataire).
2. Si le versement a réellement eu lieu : attendre/rejouer le webhook
   `payout.paid.v1` — le rapprochement s'éteint de lui-même.
3. Si le versement a échoué chez le prestataire : re-soumission à E3.
4. INTERDIT : marquer payé à la main, modifier une obligation, compter
   deux fois — le moniteur ne touche à rien et l'opérateur non plus.
