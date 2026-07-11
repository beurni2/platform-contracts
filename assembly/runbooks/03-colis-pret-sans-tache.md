# Runbook 03 — Colis prêt sans tâche de livraison
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.kind = ready_package_no_task`
(ProtectionDesk boutik-plus, fenêtre 60 min après la confirmation de
préparation, `fulfillment-aging-policy.v2`).

## Diagnostic
Tirer `order_id`. Vérifier côté Séra que la file d'intake
(`ReadyQueue`) n'a pas admis de tâche pour cette commande, et côté boutik
que la préparation est bien confirmée (`FulfillmentBook.isPickupEligible`).

## Action de reprise
1. Créer la tâche manuellement : événement `logistics.task_ready.v1` vers
   l'intake Séra (`ReadyQueue.onTaskReady`) puis assignation manuelle
   (`AssignmentBook.assign` — écran dispatch « Prêt à assigner »).
2. Si l'intake refuse (financement ou préparation non lisibles), traiter la
   cause indiquée par le refus avant de recréer la tâche.
3. L'alerte ne se répète pas pour le même épisode de préparation — une
   nouvelle alerte signifie un NOUVEL épisode à traiter.
