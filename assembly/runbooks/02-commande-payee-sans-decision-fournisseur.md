# Runbook 02 — Commande payée sans décision du fournisseur
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.kind = paid_order_no_supplier_decision`
(ProtectionDesk boutik-plus, horloge `fulfillment-aging-policy.v2`,
délai de décision 120 min).

## Diagnostic
Tirer `order_id` et `paid_at` de l'alerte. Vérifier dans le ProtectionDesk :
l'enregistrement `refund_required` (B+I-13 : remboursement acheteur
prioritaire, jamais conditionné au Fonds de protection) et la
ProtectionClaim ouverte (faute vendeur) doivent exister déjà — le desk les
crée avec l'alerte.

## Action de reprise
1. Contacter le vendeur (écran fournisseur boutik — décision d'acceptation).
2. S'il accepte : la décision retire la commande de la vue de vieillissement ;
   rien d'autre à faire.
3. S'il ne répond pas : le remboursement acheteur suit l'enregistrement
   `refund_required` — exécution du remboursement à E3 (aucun outil de
   remboursement n'existe encore ; l'enregistrement EST la trace à traiter).
   Ne jamais fermer l'alerte sans que l'un des deux soit fait.
