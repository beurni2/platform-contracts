# E2 SCENARIO MATRIX — WO-2.8 (Contract E2 exit)

> Each of the eight adversarial scenarios, driven END-TO-END through the
> live assembly wiring at the pinned post-2.7 app mains, "produces the
> defined recovery state + a reconciliation alert" (Contract E2 exit,
> verbatim). Regenerate with `pnpm e2:scenarios` — this file is written
> by that run, never by hand. Runbooks: `assembly/runbooks/`.

| # | Contract scenario | Defined recovery state | reconciliation.alert.v1 payload | Evidence (from this run) |
|---|---|---|---|---|
| 1 | reservation-held-after-payment-fail | reservation released through the live DO (idempotent on replay); order in canonical payment_failed; no escrow record exists | reconciliation.alert.v1 · alert=reservation_held_after_payment_failure · reservation_id_held=rsv_s1_id | failPayment(charge_timeout) at 2026-07-10T12:02:00.000Z → alert at 2026-07-10T12:03:00.000Z → DO release ok + replay ok |
| 2 | paid-order-no-supplier-decision | B+I-13 refund_required record (amount COPIED 12500, buyerPriority=true) + seller-fault ProtectionClaim opened; alert exactly once (fulfillment-aging-policy.v2) | reconciliation.alert.v1 · kind=paid_order_no_supplier_decision · aged past 120min | silent below deadline, one alert past it, idempotent on re-sweep; command_id=cmd_recon-decision-order_s2 |
| 3 | ready-package-no-task | package stays READY (no claim, no state mutation — dispatch is the runbook action); alert exactly once per readiness episode | reconciliation.alert.v1 · {"kind":"ready_package_no_task"} past 60min | silent below window and when a task exists; one alert in the gap; command_id=cmd_recon-ready-order_s3 |
| 4 | impossible-custody | package frozen for human resolution: NO automatic release, NO eligibility (a wrong-code drop refuses closed); dispatcher resolves per runbook | reconciliation.alert.v1 · scenario=impossible_custody · package_id=pkg_s4 | two live spines each hold ONE courier custody of pkg_s4 — the conflict is store-seam-visible; ops alert ops-alert-1 |
| 5 | evidence-not-validated | ValidationDecision reached (validated) once the operator runs the decision — evidence never auto-released anything (ops-aging-policy.v1) | reconciliation.alert.v1 · scenario=evidence_not_validated_aging · age past 30min | silent at -5min, alert at +1min; recovery decideValidation → validated |
| 6 | settlement-eligible-not-submitted | obligations REMAIN Eligible, byte-untouched (submission is E3 — the alert is the bridge until it exists); one alert per obligation (settlement-submission-ttl.v1) | reconciliation.alert.v1 · scenario=settlement_eligible_not_submitted · supplier:supplier-1 + reseller:rs_e2sc | silent at 30min, both fire past 60min, never re-fire; obligations byte-identical |
| 7 | payout-not-reconciled | payout stays UNRECONCILED — nothing marked paid, escrow + obligations byte-identical (no double-count); operator reconciles per runbook | reconciliation.alert.v1 · scenario=payout_not_reconciled · divergences=[submitted_without_paid] | certified provider responses reconcile CLEAN (0 alerts); dropping the supplier paid record → exactly one alert, no re-fire |
| 8 | offline-backlog | all 30 queues drained through the server_confirmed binding (30/30 accepted, 0 refusals) and the drained evidence validates; empty queue observes clean (offline-backlog-policy.v1) | reconciliation.alert.v1 · scenario=offline_backlog_threshold_exceeded · 30 bundles > 25 and oldest > 30min | queued=pending proven live (pre-flush validation refused on every spine); 10 bundles under both thresholds stayed silent |

Pins: sera 6213d41 · boutik 7e4901d · shop 74913d7 · canon 0ff6696 (v0.5.0).
