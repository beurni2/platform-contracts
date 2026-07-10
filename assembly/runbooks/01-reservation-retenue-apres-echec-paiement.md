# Runbook 01 — Réservation retenue après un échec de paiement
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.alert = reservation_held_after_payment_failure`.
Émise par la fonction `reservationReconciliationAlert` (shop-plus commerce-core)
quand une commande est en `payment_failed` et que sa réservation est encore `reserved`.

## Diagnostic
Tirer la chaîne de corrélation depuis l'alerte : `quote_id → reservation_id →
payment_attempt_id → order_id`. Vérifier dans le journal du spine
(`OrderSpine.journey.events`) que `payment_failed` est bien l'état courant
et que `lastPaymentFailure.reason` est renseigné (charge_rejected,
charge_timeout ou webhook_never_arrived).

## Action de reprise
1. Libérer la réservation par la commande réelle du DO de réservation :
   `{ kind: 'release', command_id: <nouveau>, quoteId: <quote_id>, nowIso: <maintenant>, reason: 'payment_failed' }`
   (rejouable sans risque : la libération est idempotente — vérifié en E2).
2. Confirmer l'état `released` puis vérifier qu'aucun enregistrement
   d'escrow n'existe pour cette commande (`ledger.escrowFor(order_id)` vide).
3. Si l'alerte se répète pour la même commande, ouvrir un incident : le
   worker de réservation ne traite plus les commandes.
