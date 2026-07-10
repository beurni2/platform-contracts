# Runbook 04 — Séquence de garde impossible
**Version : v1 (WO-2.8) · Propriétaire : fondateur**

## Détection
`reconciliation.alert.v1` avec `payload.scenario = impossible_custody`
(OpsMonitor Séra : chaîne du registre de garde rompue, ou écriture de
gardiens en conflit constatée au niveau du stockage — ex. deux gardiens
simultanés pour un même colis).

## Diagnostic
Tirer `package_id` et le détail de l'alerte. Vérifier le registre de garde
(`CustodyLedger.verifyChain()` — rupture à quel `seq` ?) et l'identité du
ou des gardiens revendiqués (`currentCustodian`).

## Action de reprise
1. GELER le colis : aucune remise, aucun code de retrait accepté tant que
   le conflit n'est pas tranché (le spine refuse déjà toute éligibilité
   sans le chemin complet de preuve — vérifié en E2).
2. Le dispatcheur identifie le gardien réel (appel coursiers, photos de
   scellé) et documente la résolution dans l'incident.
3. Jamais de libération automatique : la preuve soutient, elle ne libère
   pas. La reprise est HUMAINE par définition pour ce scénario.
