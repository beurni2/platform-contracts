# MASTER-REFERENCE-AUDIT — WO-0F verification pass (claim → source line)

> Founder-supplied reference, 2026-07-11; the specs remain normative on conflict.
> Audited file: the founder's attachment `Ecosystem-Master-Reference.md` — sha256 `8f94051609eddc4bc378469aab69f76b7415e25b559021ad624c0b02803eb8ad` · 58,755 bytes · 721 lines. Audit baseline: `/docs` at platform-contracts main `8e1f80d` (canon v0.6.0, pin `539dbc8`). "MR n" = line n of the audited file; "Doc:n" = line n of the named `/docs` file.

---

## VERDICT: **NOT CLEAN — 5 flagged rows.** Per WO-0F: STOP; the founder arbitrates; the founder's document is not edited and not committed to `/docs` until he rules.

Everything else in the document verifies against canon — including the entire money waterfall, the baseline reconciliation, the custody boundary sequence, the fault-routing table, the fleet gates, and the break-glass maker-checker split, several of them word-for-word. The five flags below are the complete list of places where the document, read on its own, states something canon contradicts or decides something canon holds open.

---

## FLAGGED ROWS (verbatim quotes; founder arbitration required)

### FLAG 1 — The "four secrets" table names a different fourth secret than canon (MR 143–151)

**MR §3.1 (lines 143–151):**
> **## 3.1 The four secrets (never substitutable, never combined)**
> | Secret | Held by | Proves |
> | **Readiness challenge** | Supplier → server | The package is genuinely prepared |
> | **Pickup verification** | Rider, at the supplier | The goods objectively match the locked order |
> | **Custody seal** | Rider applies/witnesses | Custody has *begun*; the package is closed |
> | **`buyerDropCode`** | The buyer alone | The buyer actually received it |

**Canon (the four-secret LIST is identical in all three specs — Sera-Build-Spec.md:96, Shop-Plus-Build-Spec.md:119; quoted here in Boutik-Plus-Build-Spec.md:154's annotated form):**
> **Four distinct, non-interchangeable secrets (CI-enforced separation):** `sellerReadinessChallenge` (short-TTL, in-app, seller↔readiness) · `pickupVerificationCode` (rider↔pickup) · `buyerDropCode` (buyer↔delivery, **private — never shown to the seller or in readiness evidence**) · `HandoffAuthorization` (payment-confirmed handoff).

**The contradiction:** canon's four secrets are readiness challenge · pickup verification code · buyer drop code · **HandoffAuthorization**. The MR's table replaces `HandoffAuthorization` with **the custody seal**, which in canon is not a secret at all — `custodySealId` is an openly recorded artifact (it appears in `PickupVerification`, `EvidenceBundle`, `Package/Seal`). The four-secrets separation is a CI-enforced law (Ten Laws #3); the MR elsewhere uses `HandoffAuthorization` correctly (MR 163, 381, 446, 492) — the §3.1 table itself misassembles the canon list. **Recommendation:** founder corrects the table's third row to `HandoffAuthorization` (held by: the server, issued only on provider-confirmed payment; proves: the door payment is real) and moves the custody seal out of the secrets table. The custody seal can stay in the narrative as the custody artifact it is.

### FLAG 2 — Option-B eligibility stated as a complete three-condition list; canon's gate has five (MR 120, 360)

**MR §2.5 (line 120):**
> **Eligibility (all must hold):** order ≤ **25 000 F** · seller is **verified or trusted** (never provisional) · buyer passes the refusal ladder (`PayAtDoorEligibility`).

**MR Part 6 payment table (line 360):**
> | Who can use it | **Everyone, always** | Order ≤ **25 000 F** · seller **verified/trusted** · buyer passes the refusal ladder |

**Canon (Shop-Plus-Build-Spec.md:136):**
> **Option-B gate (evaluated at quote):** seller tier ≥ verified · **category inspectable** · order ≤ price cap (pilot ~25,000 F) · **network-reliable zone** · `PayAtDoorEligibility.state = allowed`.

(also Shop-Plus-Build-Spec.md:85: "eligible for **verified+ sellers**, category/price/zone-eligible, buyer-eligible")

**The contradiction:** the MR presents three conditions as the full gate ("all must hold"); canon requires five. An order in a non-inspectable category, or in a zone without reliable network, meets the MR's list and is still ineligible under canon. The shipped WO-2.5 quote gate implements all five. Also: canon's cap is "pilot ~25,000 F" (approximate, pilot-tunable); the MR states a flat "≤ 25 000 F". **Recommendation:** founder adds the two missing conditions (and "pilot" on the cap), or marks the list "principal conditions — full gate in Shop+ §6.1".

### FLAG 3 — Free-delivery threshold names a value canon does not contain, inside an open Decision (MR 350)

**MR Part 6, delivery table (line 350):**
> | **Free delivery** | 0 F | **Only when genuinely funded:** subtotal ≥ 15 000 F in dense zones — *or* a funded campaign. Never a fake giveaway. |

**Canon:** no occurrence of "15 000", "15,000", or "dense" anywhere in `/docs` (verified by search). The governing Decision is **open**: Sera-Build-Spec.md:185 "⏳ Delivery fee table + zones + min-margin gate (feeds `DeliveryFeeQuote`)"; Sera-Building-Plan.md:97 safest default "high-floor zones; conservative capacity". The MR's own Part 15 (line 705) lists "Delivery fee table + zones + min-margin gate" as open.

**The contradiction:** a named eligibility threshold for a money-visible buyer benefit, with no canon source, in a domain the document itself declares undecided. If 15 000 F/dense-zones is a decision the founder is now making, it belongs in the Decision register (and Séra's fee-table Decision partially closes); if it is an illustration, it must read as one. **Recommendation:** founder either strikes/illustrativizes the numbers or closes the Decision explicitly. Until then the safest default in force is the plan's ("high-floor zones; conservative capacity" — no free-delivery tier).

**Companion, same Decision (verifier-found):** MR 349 "| **Standard** (today, 16h–18h) | **1 000 F** | Always |" — the **16h–18h** window is likewise unsourced (zero `/docs` matches for "16h"/"18h") and scheduled-window pricing sits inside the very same ⏳ Decision (Sera-Build-Spec.md:185: "… **+ scheduled-window pricing** …"). Arbitrate together with the free-delivery row so a fix to one does not leave the other behind. (The 1 000 F itself is canon's worked-baseline D — sourced.)

### FLAG 4 — The refusal-ladder escalation tiers differ from canon's (MR 406, 608)

**MR §6.4 (line 406):**
> **Good standing** → Option B available · **Repeated whim-refusals** → a deposit is required · **Persistent abuse** → **FULL_PREPAY only** for a period.

**MR Part 11 (line 608):**
> | **Repeat refuser** | Ladder escalates: → deposit required → **FULL_PREPAY-only** for a period. | Buyer | `PayAtDoorEligibility` |

**Canon (Shop-Plus-Build-Spec.md:152):**
> **1st ordinary buyer-fault** → next order requires higher delivery commitment **or** small product deposit; **2nd** → `FULL_PREPAY` for next 3 orders (`prepayOnlyUntil`); **repeated abuse** → suspend pay-at-door; **fraud** → immediate restriction/review.

**The contradiction:** canon escalates at the **1st** ordinary buyer-fault (commitment/deposit) and reaches prepay-only at the **2nd**; the MR starts escalation only at "repeated" refusals, places prepay-only at "persistent abuse", and omits canon's suspension and fraud tiers. The MR's ladder is materially more permissive than the normative one. (The MR's "Justified refusals never count against her" is consistent with canon — justified refusals are seller-fault; canon additionally protects honest absence/provider failure from abuse-like escalation, MR 606–607 consistent.) **Recommendation:** founder aligns the tiers to §6.4's four steps.

### FLAG 5 — Two normative lists restated incompletely under their canonical names (MR 224, 626)

**(a) B+I-01, MR Part 4 (line 224):**
> **B+I-01:** a product goes live only with approved facts + ≥1 active variant + an approved price-free canonical hero.

**Canon (Boutik-Plus-Build-Spec.md:45):**
> **B+I-01:** Every active product version MUST have approved facts, ≥1 active variant, an approved **price-free** canonical hero, an approved **public-safe actual-item proof**, and an approved moderation decision.

The MR omits the proof asset and the approved moderation decision while quoting the invariant by ID — read alone, it permits going live without two of B+I-01's five conditions.

**(b) The Cercle build gate, MR Part 12 (line 626):**
> **Gate:** ≥20 active resellers (≥3 validated deliveries each) · ≥150 cumulative validated deliveries · **the drop-code → settlement loop stable for 4 consecutive weeks** · Séra scheduled windows live · payment-partner campaign-allocation structure confirmed.

**Canon (Shop-Plus-Build-Spec.md:204):** the same five items **plus**: attribution stable · regulatory treatment documented · review/media-consent flow approved · opt-out + frequency enforcement implemented · Boutik+ stock/pause events reliably received.

The MR lists five of canon's ten gate items — read alone, the gate looks easier to open than it is. **Recommendation:** founder appends "(abridged — full invariant/gate in the spec)" at both sites, or completes the lists.

---

## REPORT-ONLY NOTES (not blocking; no arbitration required)

- **N1 — Internal numbering:** Part 12's subsections are numbered 9.1/9.2/9.3 (MR 622/628/634) and Part 13's are numbered 10.1–10.8 (MR 643–671). Founder-side cosmetic; pre-classified report-only by the work order.
- **N2 — PackLab "~50% waypoint" (MR 630):** the glide "60–80% M0–3 → ~50% waypoint → ≤30% by M9–12" adds a waypoint canon does not state (Boutik-Plus-Build-Spec.md:62 and :220 carry only 60–80% → ≤30%). The three ceiling **values** are ⏳ open (Boutik §12:220), the gate is closed, and MR Part 15 (line 708) concurs — direction-only content, no live surface affected. The likely source is the PackLab North Star, which is **not in `/docs`** (see scope note).
- **N3 — Ops-console gap (Part 9) vs Séra's console desks:** Sera-Build-Spec.md:155 already places «**Fonds de protection** (solvency dashboard + claims by fault-class + custody-liability)» and «**Éligibilité acheteur** (refusal ladder review)» in Séra's dispatch/ops console. This does not refute the MR's cross-app-home gap (claims adjudication, provider reconciliation, and moderation ownership remain homeless), but it is material input to D22: part of what Part 9 assigns to the future ops console has a canon home in `sera` today.
- **N4 — Wording nuances (each stated precisely elsewhere in the MR itself):** MR 116 "gives the drop code" — canon: the buyer **enters** it, last (MR 381/447/586 state it correctly). MR 333 "locked to Aïcha … before she has done anything" — canon locks `reseller_id` at quote/confirmation (Shop:40); qualification happens at arrival (MR 297 and golden-path row 9 state it correctly). MR 614 cites B+I-03 for mid-campaign auto-pause — the behavior is canon (Boutik:183 auto-pause; Shop:41 auto-hide) but B+I-03 itself is the inventory-pool invariant. MR 533 "platform loss account" — `faultClass = platform_system` exists (Boutik:148); the account name is not a canon term. MR 225 moderation chain "draft → submitted → changes-requested → approved → paused → retired" — no `/docs` line enumerates the exact chain; consistent with B+3 and Desk-3 rules. MR 188 "the reseller never loses money because another participant failed" — canon states this campaign-scoped (SP-I16, Shop:55); the generalization is consistent (ledger projections; fault routing never debits her) but is wider than the canon sentence. MR 433 batching deferred "until density justifies it" — canon: until **E6** (Sera:144, plan:26). MR 363–364 disabled-Option-B honest-reason strings are illustrative; the built WO-2.5 door states carry the catalog strings. MR 171's MAY-NOT list omits canon's "cosmetic genuineness" and "shade-vs-photo match" (Sera:109) — the FLAG-5 abridgment family at negligible stakes (the MAY list grants neither).
- **N5 — "No account" for the buyer (MR 326, 398):** canon has no registration requirement — the buyer is "buyer (web), minimal session" (Shop:28, plan SP0.2). Consistent; no canon line says "no account" verbatim.
- **N6 — Taglines/promises** (MR 194, 269, 415) are new founder copy, not canon strings; each is consistent with the invariants it fronts (zero-deposit + same/next-day; net-first no-stock; verify-seal-paid-handoff). On canonization they enter the i18n catalog only via the normal register-tagged path if ever used in UI.

---

## SCOPE NOTE — sources not in `/docs`

The North Stars (`Shop-Plus-Cercle-North-Star-Spec.md` v2.0, `Shop-Plus-PackLab-Founding-Catalog-North-Star.md` v2, `Boutik-Plus-Diaspora…`) are cited as authoritative by the specs but are **not present in `/docs`**. Part 12 claims that trace only to them (the "~50% waypoint", the Restock-Law aphorism, "recette Quartier buys route density" framing) were checked against what canon does carry (B+I-16…20, SP-I14…18, plan Phases 5/C — recipe names, three gestures, sacred preview, K-gate all verify against Shop-Plus-Building-Plan.md:92–104) and none is contradicted; they could not be verified to their primary source. This document itself supersedes the "North Stars awaited" deferral once canonized.

---

## VERIFIED ROWS (claim → source line)

### Part 0 — the one page
| Claim (MR line) | Source | Status |
|---|---|---|
| Three apps / what each manufactures (13–17) | charter framing; Boutik:9, Shop:7, Sera:7 | ✓ |
| Six surfaces: buyer PWA ships from `shop-plus` (25) | Shop:19 (buyer = web/PWA, no install) | ✓ |
| Dispatch console ships from `sera` (27) | Sera:57 ("web dispatch + ops console"), Sera:23 | ✓ |
| Ops console "no home yet" (28) | see FLAG-free N3; D22 open | ✓ (open by design) |
| The chain, compressed (32) | Boutik:99 / Sera:63 boundary | ✓ |
| Three non-negotiables (34–37) | Boutik:78 no-funds; Sera:37 SE-I05; Boutik:92 reconciliation | ✓ |
| Repo topology, four repos, pinned package, drift-check (54) | Contract:20 | ✓ (near-verbatim) |

### Part 1 — planes
| Claim | Source | Status |
|---|---|---|
| Supplier rules B, C, stock, readiness (47) | Boutik:18, :177 | ✓ |
| Reseller rules M, storefront; suppliers hold no demand levers (48) | Shop:18; Boutik:20–21 | ✓ |
| Custody: platform executes, transparency (49) | Sera:7, :37–44 | ✓ |
| Money: deterministic waterfall, no discretion (50) | Boutik:99 ("no app marks paid"), Sera:63 | ✓ |
| B+I-15 single channel; PackLab is a supply mode (52) | Boutik:59, :11 | ✓ |

### Part 2 — money
| Claim | Source | Status |
|---|---|---|
| Five variables + visibility (62–68) | Boutik:81, Shop:42 (SP-I03), Sera:68 (D owned by Séra) | ✓ |
| §2.2 waterfall, all six formulas (72–79) | Shop:76–81 ≡ Boutik:83–90 ≡ Sera:60 | ✓ identical |
| C never added twice; D outside fee bases (82–83) | Boutik:83, :92; Shop:82 | ✓ |
| §2.3 baseline: 11 500 / 12 500 / 500 / 8 500 / 2 500 / 500 / 2 000 / 1 000 / 1 000 (87–101) | Boutik:92; Shop:82 (+ exact arithmetic) | ✓ |
| Reconciliation identity `11 500 = 8 500 + 2 000 + 1 000`; CI gate in all three repos (103) | Boutik:92 "(8,500 + 2,000 + 1,000 = 11,500 ✓)"; Shop:197, Boutik:213, Sera:179 | ✓ |
| §2.4 net always, gross-first prohibited, 20% real from launch (105–107) | Shop:43 (SP-I04), :51 (SP-I12), :82, :167 | ✓ |
| §2.5 two modes, amounts per mode (111–119) | Shop:85; Boutik:96–97 | ✓ |
| Option A available to everyone; only option for provisional (115) | Shop:85 ("verified+"); Boutik:31 | ✓ |
| Option B eligibility (120) | — | **FLAG 2** |
| SE-I11 door payment provider-confirmed (121) | Sera:43 | ✓ |
| Fully-free delivery ⇒ FULL_PREPAY (125, SP-I16) | Shop:55; Sera:127 | ✓ |
| §2.6 nobody touches money; webhook only truth (128–131) | Boutik:22, Shop:22, Sera:41 (SE-I09), Boutik:99 | ✓ |
| §2.7 zero deposit (B+I-12); fund capitalized before launch; B+I-13; tiers earned (134–137) | Boutik:56, :165, :57, :31–33 | ✓ |

### Part 3 — custody
| Claim | Source | Status |
|---|---|---|
| §3.1 four secrets table (143–151) | — | **FLAG 1** |
| Drop code never in readiness evidence — CI gate (152) | Boutik:154, :213; Sera:179 | ✓ |
| §3.2 sequence funded→…→ValidationDecision→eligible (156–166) | Sera:63; Boutik:99 | ✓ step-for-step |
| §3.3 bounded verification MAY/MAY-NOT (170–171) | Sera:109 (MR = faithful subset), :44 (SE-I12) | ✓ |
| Liability rationale: conformity not quality (173) | Sera:109 | ✓ |
| §3.4 evidence supports never releases; offline pending (175–176) | Sera:38 (SE-I06), :39 (SE-I07), :63 | ✓ |
| §3.5 fault table: seller→Fund; Séra→CustodyLiabilityClaim; buyer→forfeits D; provider→arrangement; platform→loss account (180–187) | Sera:109, :121; Boutik:150, :169; Shop:55, :134 | ✓ (loss-account naming: N4) |

### Part 4 — Boutik+
| Claim | Source | Status |
|---|---|---|
| B+1 screens, MoMo payout, tiers table (200–211) | Boutik:174, :31–33 | ✓ |
| Zero-deposit law (212) | Boutik:56, :23 | ✓ |
| B+2 deterministic imaging; B+I-02/08/09 (216–221) | Boutik:55, :46, :52, :53 | ✓ |
| B+I-01 (224) | Boutik:45 | **FLAG 5a** |
| B+4 supplier sets B+C, sees waterfall; B+I-04 forward-only (229–235) | Boutik:177, :48 | ✓ |
| B+5 B+I-03; auto-pause downstream (238) | Boutik:47, :183; Shop:45 | ✓ |
| B+6 readiness gate B+I-06; no drop code in evidence (242–245) | Boutik:50, :179, :154 | ✓ |
| B+7 B+I-07 custody service declares; B+I-14 provisional (249–250) | Boutik:51, :58 | ✓ |
| B+8 same/next-day payout, provider ref before Paid; B+I-05; fault never debits (254–257) | Boutik:181, :49 | ✓ |
| B+9 gated pointer (259–260) | Boutik:19, :182, :220 | ✓ |
| Never-do list (263) | Boutik:20–23, :59, :51, :55 | ✓ |

### Parts 5–6 — Shop+ and the client
| Claim | Source | Status |
|---|---|---|
| SP1 activation quadruple (276) | Shop:178; plan:34 | ✓ |
| SP2 net-first card; SP-I05 stores; SP-I03 + Enseigne exception (280–285) | Shop:161, :44, :42, :21, :58 | ✓ |
| SP3 SP-I02, markup versioned forward-only (289) | Shop:41 | ✓ |
| SP4 price-free assets; customer card no commission; SP-I08 (292–293) | Shop:163, :47 | ✓ |
| SP5 SP-I09 signed tokens; SP-I01 locked at confirmation; tamper fails closed (296–298) | Shop:48, :40, :164, :197 | ✓ |
| SP7 SP-I07 consent-scoped (302) | Shop:46, :166 | ✓ |
| SP8 net-first states; SP-I06 single-level (305–306) | Shop:167, :45 | ✓ |
| PWA: no install; trust badges before ask (326–329) | Shop:19; "no account": N5 | ✓ |
| Location primitive + voice directions (341–344) | Boutik:71/Shop:65/Sera:51 (kernel) | ✓ |
| Delivery priced by Séra alone (346–353) | Sera:68; free-delivery row: **FLAG 3** | ✓ except FLAG 3 |
| Payment-choice table (356–361) | Shop:132–136; eligibility column: **FLAG 2** | ✓ except FLAG 2 |
| SP-I13 what-paid-now/due; no double charge (366) | Shop:52 | ✓ |
| Tracking coarse, not live GPS; masked relay (369) | Sera:40 (SE-I08), :145 | ✓ |
| Inspection dwell 2–4 min; disclaimer quote (372–376) | Sera:109 — disclaimer **verbatim** | ✓ |
| Decision fork incl. can't-pay → no handoff (378–386) | Sera:115–118 (§6.3–6.4); Shop:134, :152 | ✓ |
| Verified review only from validated delivery (389) | Shop:56 (SP-I17) | ✓ |
| Bill of rights (392–399) | Shop:52/:42/:46; Sera:109/:145; kernel | ✓ |
| §6.4 ladder object shape (404) | Shop:112 — six of canon's seven fields (omits `buyerRef`, the key; harmless) | ✓ · tiers: **FLAG 4** |
| §6.5 never-do (409) | Shop:42, :52; Sera:43; SP-I18 no dark patterns | ✓ |

### Parts 7–8 — Séra and dispatch
| Claim | Source | Status |
|---|---|---|
| Riders employed; wages workforce cost (SE-I09); location on-shift only (SE-I08) (420–421) | Sera:41, :17, :40; plan:96 | ✓ |
| SE2 funded-per-mode gate + campaign share counts; SE-I01 lease (423–428) | Sera:34, :127, :33, :57 | ✓ |
| SE3 one manifest/current stop; task status never custody truth; batching deferred (431–433) | Sera:35, :36, :144 (E6: N4) | ✓ |
| SE4 landmark nav; masked relay (436) | Sera:145 | ✓ |
| SE5 verify→refuse-or-seal; no round-trip; fund `faultClass=seller` (439–442) | Sera:109, :112 | ✓ |
| SE6 SE-I11; drop code last; break-glass exceptional (445–449) | Sera:43, :115 | ✓ |
| SE7 SE-I10 no generic failed; two-key return (452–453) | Sera:42, :121 | ✓ |
| SE8 SOS + drill (456) | Sera:149, :178 | ✓ |
| SE9 decomposed cost; fleet gates 3–5 / ~5 / ≥8/day ~2wk / <8% / contribution / charging plan; density law (459–461) | Sera:134, :137; plan:78 — **value-exact** | ✓ |
| Never-do (464) | Sera:41, :15, :54, :44, :33, :39, :63 | ✓ |
| 8.1 human dispatch; deterministic suggestion only (473) | Sera:57 | ✓ |
| 8.2 queue/lease/board/exceptions desks (477–489) | Sera:34, :57, :35–36, :121, :42 | ✓ |
| Break-glass maker-checker split (491–495) | Sera:23, :115 — role-exact | ✓ |
| Dwell over-target ops signal; SOS drill before pilot; cluster = grouping aid (498–499) | Sera:109, :149, :127 | ✓ |
| 8.3 MAY/MAY-NOT table (502–507) | Sera:23 | ✓ |

### Part 9 — Ops (D22 open)
| Claim | Source | Status |
|---|---|---|
| Roles quoted (513, 556) | Boutik:28; Sera:23 | ✓ |
| Gap claim + fifth-repo recommendation (513) | open — D22; see N3 | recorded |
| Iron rule: no ledger edits, maker-checker (515–518) | Boutik:28; Sera:23 | ✓ |
| Desk 1 fund; B+I-13 never gated (522–524) | Boutik:164–169, :57 | ✓ |
| Desk 2 routing table (527–533) | Boutik:148–150; Shop:55; Sera:121 | ✓ |
| Desk 3 moderation rules (535–536) | Boutik:28, :46, :55; specific reasons: Shop:72/N4 | ✓ |
| Desk 4 related-party tiers (538–541) | Shop:155 — tier-exact incl. landmark/network | ✓ |
| Desk 5 reconciliation; divergence pauses new reservations only (543–544) | Shop:53 (SP-I14); Contract:31 | ✓ |
| Desk 6 ladder oversight (546–547) | Shop:152 | ✓ |
| Desk 7 kill-switches without deploy (549–550) | Contract:127 | ✓ |
| Desk 8 append-only audit; maker-checker (552–553) | Sera:57 (hash-chained), :23; Contract:181 | ✓ |
| 9.4 never-become list (559–560) | Boutik:28; Sera:23, :43; Shop:42 | ✓ |

### Part 10 — golden path
All 19 rows verify against their cited rules (B+I-01/02/11/12 · SP-I04/12/03/09/01/13 · B+I-04/06 · SE-I02/01/12/05/03/04/08/11 · B+I-07 · waterfall) — Boutik:45–59, Shop:40–52, Sera:33–44 — with the row-8 eligibility narrative covered by FLAG 2's arbitration. The row-18/19 numbers reconcile exactly. ✓

### Part 11 — failure table
Every row verifies (Shop:52 idempotency; Boutik:50 readiness; Sera:109 mismatch no-round-trip; Sera:42/:121 refusals/no-show; Boutik:150/Sera:121 custody liability; Sera:38 offline; Boutik:57 provider failure; Shop:48/:197 tamper fails closed; Shop:56 related-party; Boutik:183 auto-pause) — except the repeat-refuser row (FLAG 4) and the B+I-03 citation nuance (N4). ✓

### Parts 12–15 — gated layers, laws, order, decisions
| Claim | Source | Status |
|---|---|---|
| Cercle: consent Cercle, 3-gesture recipes, sacred preview, settled-earnings funding, K ≤ 0.80(C+M), one benefit, `customerShare+campaignShare==quote`, attributed-never-generated (623–625) | Shop:53–57, :168; plan:92–98 | ✓ |
| Cercle gate list (626) | Shop:204 | **FLAG 5b** |
| PackLab: BOM/kitting/ceilings/Restock/six-question/covenant/upgrade (629–632) | Boutik:60–64, :182; plan:105–112 | ✓ (waypoint: N2) |
| Diaspora parked, agent must refuse (635) | Boutik:5; charter §4 | ✓ |
| 10.1 deterministic (644) | Boutik:55; Shop:50; Sera:57 | ✓ |
| 10.2 offline queued=pending; never final custody offline (648) | Sera:51, :38 | ✓ |
| 10.3 French Voice: North-Star line **verbatim**, registers, 6th grade, no séquestre, Mooré/Dioula, copy-lint (651–657) | Contract:189, :194–202, :210–216 | ✓ |
| 10.4 no street addresses (660) | kernel 5.1 (all three) | ✓ |
| 10.5 phone alias, masked relay (663) | Boutik:71; Sera:18 | ✓ |
| 10.6 single-level permanent refusal (666) | Boutik:54; Shop:45 | ✓ |
| 10.7 budgets named at E0, enforced (669) | Contract:129–130; PERF-BUDGETS.md (D17) | ✓ |
| 10.8 5-second/trust tests, one primary action, honest states, celebration, `platform-contracts/ui` (672–676) | DESIGN-LANGUAGE.md; Contract:20; plan guardrails | ✓ |
| Part 14 era table E0→gated (686–691) | Contract:17–48; plans' E0–E6 alignment | ✓ |
| Part 15 open-decision ledger rows (700–711) | Shop:203–204; Boutik:219–220; Sera:185; Contract:139, :40 | ✓ (D22 = new, founder-pending) |
| "Open decision never closed by an agent" (713) | charter §2/§7 | ✓ |

### The last word
The closing identity `11 500 = 8 500 + 2 000 + 1 000` (721) reconciles — Boutik:92. ✓

---

## ARBITRATION (founder ruling, 2026-07-11 — recorded verbatim; execution held on missing edit text)

The founder's ruling, verbatim as received:

> WO-0F ARBITRATION — founder rules: canon wins on all five flags. Apply the five corrections EXACTLY as the founder's relayed text (they are founder-labeled edits), commit the amended document as docs/ECOSYSTEM-MASTER-REFERENCE.md (v1.1, sha in journal, manifest regenerated), note the N-items as accepted wording nuances, then STEP 2–3 of the original order. The audit file records the arbitration verbatim.

**Rulings now in force:** ① canon wins on FLAGS 1–5 (and the FLAG-3 companion rides FLAG 3's correction); ② the N-items (N1–N6 + the verifier's SE-I12/buyerRef notes) are **accepted wording nuances** — closed, no further action; ③ the corrected document enters `/docs` as **v1.1** under the DESIGN-LANGUAGE pattern once amended.

**Execution status: HELD at the edit-text boundary.** The ruling instructs applying the five corrections "EXACTLY as the founder's relayed text (they are founder-labeled edits)" — but no corrected text reached this session: the relay message body carries none, and the uploads directory holds only the original document (sha `8f94051609eddc4bc378469aab69f76b7415e25b559021ad624c0b02803eb8ad`, verified at hold time). Under the untouchable-bytes law and the standing relay-content discipline (content must exist in the session's own record — never inferred from relay prose), the CTO does not author founder-labeled edits. The five corrected passages (or the amended v1.1 file) are awaited; on arrival each is re-verified against the canon lines in FLAGS 1–5 above, then the original order's STEP 2–3 runs unchanged.

### Arbitration executed (2026-07-11) — the five corrected passages received, re-verified, applied; v1.1 committed

The founder's five corrections arrived relayed verbatim (founder-labeled edits). Each was re-verified against the canon lines in FLAGS 1–5 before application — **all five PASS**:

1. **CORRECTION 1** (§3.1 table): the « Custody seal » row deleted; in its place "| **`HandoffAuthorization`** | the signed handoff authorization (Option B door confirmation / break-glass) | never substitutable — a rider's word is not payment truth |"; after the table: "The custody seal is an openly recorded artifact (`custodySealId`) — essential, but not a secret; it lives in the custody chain, not this table." → matches the CI-enforced four-secret list (Sera:96, Shop:119, Boutik:154) and SE-I11's no-rider's-word rule (Sera:43). CLOSES FLAG 1.
2. **CORRECTION 2** (MR 120 + 360, both occurrences): "Option B is available only when **all five** hold: seller tier ≥ **verified** · category **inspectable** · order ≤ the price cap (pilot ~25 000 F) · **network-reliable zone** · `PayAtDoorEligibility.state = allowed`." → term-for-term the Shop-Plus-Build-Spec.md:136 gate, pilot-approximate cap restored. CLOSES FLAG 2.
3. **CORRECTION 3** (MR 350): the free-delivery row replaced with "Delivery is priced by **Séra alone** via `DeliveryFeeQuote`. Zone fee tables, any free-delivery thresholds, and delivery windows are an **open Decision (⏳ D6)** — every figure or window that appears in examples here is illustrative, never canon." → **Decision D6 stays open** (founder's explicit ruling: "illustrativize, do not close"); matches Sera:68 (Séra owns the quote) and the D6 register (WO-2.5 ruling ①). The sentence also illustrativizes the 16h–18h window — CLOSES FLAG 3 **and its companion**. *(Rendering note, report-only: the replacement is a prose line between two table rows, exactly as relayed — a founder-side formatting choice.)*
4. **CORRECTION 4** (MR 406 + 608, both occurrences): the four canon tiers exactly — 1st ordinary buyer-fault → higher delivery commitment or small product deposit · 2nd → `FULL_PREPAY` for the next 3 orders (`prepayOnlyUntil`) · repeated abuse → pay-at-door suspended · fraud → immediate restriction and review → matches Shop-Plus-Build-Spec.md:152 tier-for-tier. CLOSES FLAG 4.
5. **CORRECTION 5** (MR 224 + 626): "*(abridged — the complete five-condition text lives in the Boutik+ spec)*" and "*(abridged — the complete ten-item gate lives in the Shop+ spec, SP9)*" appended. CLOSES FLAG 5 (a) and (b).

**Application discipline:** the corrections were applied by script against the staged byte-exact original (source sha asserted `8f94051609eddc4bc378469aab69f76b7415e25b559021ad624c0b02803eb8ad`; every touched line asserted equal to the audited original before replacement). The v1.0→v1.1 unified diff shows exactly 8 replaced lines + 2 inserted lines — nothing else moved. **v1.1 identity: sha256 `f9b148b2063c7db847d6f0c9444558b30a7347e7a028b36017addca6d72d9dbd` · 59 738 bytes · committed as `docs/ECOSYSTEM-MASTER-REFERENCE.md` · manifest regenerated to 10 docs at packageVersion 0.6.0 (both copies).** N-items stand closed as accepted wording nuances per the ruling. This audit's header note remains in force: the specs stay normative on any future conflict.
