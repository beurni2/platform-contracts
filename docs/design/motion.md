# MOTION — Grand Teint
### The law, per interaction · v1.0.0

**Global law:** animate only `transform` and `opacity`. 150–250 ms for transitions, < 100 ms for feedback, ≤ 800 ms for celebrations. Never linear, never blocking, never layout. Every animation has a reduced-motion static equivalent that loses no information. (Tokens: `motion.*` in `tokens.json`.)

## Per interaction

| Interaction | What moves | Duration / curve | Why (motion explains) |
|---|---|---|---|
| Press (any button/row) | scale → 0.98, opacity → 0.92 | ≤ 90 ms, linear-in spring-out | "The machine felt your finger" — before any network call |
| Screen enter | translateY 14 → 0, opacity 0 → 1 | 240 ms `springSoft` | New screen arrives from the direction of travel |
| Bottom sheet (C2) | translateY 105% → 0; scrim opacity 0 → 1 | 240 ms `springSoft` / 200 ms | The sheet comes from off-screen, dismisses the same way |
| Option select (C4/C5) | border swap + accent edge + corner mark appear | 150 ms border-color only | Selection is instant and structural; no bounce at money moments (trust veto) |
| Toggle switch | knob translateX 14 | 150 ms | Direct manipulation |
| Waiting (submit) | 3 px bar scaleX 0.12 ↔ 0.92, origin left | 1.4 s loop `ease-in-out` | Honest "working" texture; **no spinner** |
| Provider wait dots | 3 dots opacity stagger | 1.2 s loop | "We are listening for the operator" |
| Skeleton | opacity pulse 1 ↔ 0.4 | 1.1 s loop | Content is coming; dimensions already exact |
| Count-up (money arrival) | number value 0 → net, outCubic | ≤ 560 ms, tabular digits | The pride of the number, without jitter |
| Recording dot | opacity pulse | 1 s loop | Live microphone |

**Forbidden:** animated height/width (accordions morph via cross-fade + scale instead) · parallax · looping decoration · anything that delays input.

## The three celebrations (storyboards)

Shared skeleton (total < 800 ms, tap anywhere = skip, never blocks input):

```
t=0      halo (220px circle, theme tint) scale .35→1.18, opacity 0→.55→0   700ms springSoft
t=0      ring (132px, theme colour) scale .5→1.32, opacity .8→0            620ms springSoft
t=0+14i  10 motifs fly outward on rays (rotate i·36°, translateY −76/−118) 640ms flyOut, stagger 14ms
t=50     badge (theme block, 900 caps label) scale .55→1.07→1              260ms springPop
t≈860    layer self-removes; the state underneath is already true
```

**1 · « Produit prêt » — Boutik+ (B7).** Trigger: press « CONFIRMER : PRODUIT PRÊT ». Motif: woven diamond (losange tissé), supply green `#1F4D36` + ochre `#D9A441`. Badge: green block « PRODUIT PRÊT ». Under the layer, the screen has already flipped to the confirmed panel with « Dès que c'est confirmé, Séra vient chercher le colis. » + « Avant ce soir 18 h. » *Feeling: my work is ready, and the system saw it.*

**2 · « Première vente » — Shop+ (S6).** Trigger: first validated sale lands. Motif: woven diamond, terracotta `#C2571B` + ochre. Badge « PREMIÈRE VENTE ». Simultaneous **count-up 0 → 2 000 FCFA in 560 ms** (outCubic, tnum). Chip « PREMIÈRE VENTE ! » persists after the layer leaves — the celebration ends, the fact remains. *Feeling: I earned this, and it's mine.*

**3 · « Course validée » — Séra (R11).** Trigger: drop code validated. Motif: **road chevrons** (not weave — his language is the road), ink + amber `#B98A1F`, rays offset 18°. Badge: ink block, amber text « COURSE VALIDÉE ». *Feeling: the proof is complete.*

**Reduced motion:** no layer, no count-up — the confirmed state, chip, or validated panel appears at once. Same information, zero movement.

**Cost:** pure inline SVG + CSS keyframes on transform/opacity. No library. ≈ 0 bytes beyond ~2 KB of shared keyframes/markup; zero layout work per frame (GPU-composited).
