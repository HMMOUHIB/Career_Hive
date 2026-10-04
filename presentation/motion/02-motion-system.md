# 02 · Creative direction & motion system

## Creative direction: "Grow on purpose"

The product's own headline (the sign-in page) is the film's thesis. A career is a **path of steps**, and CareerHive
is **the hive** where the steps live together. Every film tells the same arc:

```
SIGNAL → HIVE → PROMISE → PROBLEM → ONE PLACE → LEARN → PROVE → HEAR IT LIVE → CONNECT → NEXT STEP → GROW → CONVERGE → BRAND
(spark)  (identity)  (career)  (scattered)  (solution)  (formations) (reviews) (notifications) (chat/feed) (CV coach) (promotion)
```

| Act | Question it answers | Mood | Ground |
|---|---|---|---|
| 01 · Signal | what is this? | quiet, dark, one light | Night |
| 02 · Problem | why does it exist? | cold, scattered | cold paper + Ember accents |
| 03 · Solution | what is it? | lift, clarity | Frost floor |
| 04 · Experience | what can I do with it? | precise, alive | alternating Paper / Frost |
| 05 · Intelligence | is it smart? | focused, technical | Night |
| 06 · Outcome | what do I get? | resolved, bright | Paper → Frost |
| 07 · Brand | who made it, where is it? | calm, confident | Frost |

The "intelligence" act shows only what exists: the **rule-based** CV coach (skills, seniority and track found by
rules, formations ranked by the gaps they fill), the skills radar and the organisation's activity. There is no AI
model in CareerHive, and the films never say there is.

**Keywords:** intelligent · precise · ambitious · human · bright · calm confidence.
**Not:** neon cyberpunk, glitch, particle storms, fake holograms, stock "business people".

---

## Motion principles

1. **The product is the hero.** Every scene shows real UI (2× captures, built-in demo data). Typography introduces
   it; it never replaces it.
2. **Arrive soft, land sharp.** The signature entrance is a *focus pull*: blurred and slightly large, settling sharp
   with a long, decelerating tail.
3. **Every transition comes out of the shot:** the iris from the wordmark, the course drawer from its catalog card,
   the floor under the next chapter, the honeycomb from the screens.
4. **Hierarchy through depth.** Important things come closer (z, scale, sharpness); context recedes (dimmed, blurred,
   smaller).
5. **Cuts land on the music.** 100 BPM: beat 0.6 s, bar 2.4 s. Scene changes sit on bar lines (7.2 · 12.0 · 16.8 ·
   21.6 · 26.4 · 31.2 · 36.0 · 40.8 · 45.6 · 48.0 · 52.8 s in the master).
6. **Numbers count.** A value on screen never pops in. It eases up from 0 to the value shown on the real screen.
7. **Restraint.** Blur only while something moves. Glow only on light sources (the signal, the scan beam, the streak)
   and status rings. One light sweep per hero shot. No shake, no glitch.
8. **Honesty is visible.** A quiet "REAL UI · DEMO DATA" tag sits in the corner while product screens are on screen.

---

## Tokens

| Token | Value | Use |
|---|---|---|
| `out5` | `1 − (1 − p)⁵` | focus pulls, word rises (≈ the app's `--ease: cubic-bezier(.16, 1, .3, 1)`) |
| `out` | `1 − (1 − p)³` | general settles |
| `inout` | cubic in-out | camera moves, iris, wipes, exits |
| `expo` | `1 − 2^(−10p)` | floor rises (fast start, long glide) |
| `back` | overshoot 1.55 | chips, rings, ticks: small "confirmed" pops only |
| `in` | `p³` | dives toward camera, collapses |
| Focus pull | 0.55 s · blur 14 → 0 px · scale 1.06 → 1 | default entrance |
| Focus out | 0.35 s · blur 0 → 12 px · scale 1 → 0.96 | default exit |
| Word rise | stagger 0.09 s · 0.62 s · from 110 % below its own mask · blur 10 → 0 | headlines |
| Letter rise | stagger 0.035–0.04 s · 0.6 s · blur 8 → 0 | wordmark only |
| Counter | 1.3 s · ease out-quart | every number |
| Floor | 0.45 s · `expo` · origin bottom | chapter change |
| Iris | 0.5–0.85 s · `inout` · hexagon | change of world (light ↔ night) |
| Grid | beat 0.6 s · bar 2.4 s | timing |

**Colour** (the app's Frost theme): Frost `#2F7BF6` · Sky `#5FB2FF` · Ice `#8FD0FF` · Indigo `#1C3FC9` · Ink `#0E1A2F`
· Paper `#F5F8FC` · Night `#061633 → #030A1A` · Ember `#F2554A` (the problem only) · Good `#14A36B` (approvals only).
**Type** (the app's fonts): Bricolage Grotesque 800, tracking −0.045 em, for display; Onest for text; Martian Mono
uppercase, tracking 0.3 em, for kickers and labels.

---

## Transition vocabulary

| Name | What happens | Where | Function in `source/` |
|---|---|---|---|
| **Signal bloom** | a point of light flares, a hexagon draws around it, the hive grows ring by ring, then collapses into the app's emblem | opening | `opening()` |
| **Coin turn** | the app's 3D emblem turns once on its axis as it arrives (the app's own loading-screen move), from a 48-frame render of the real model | opening, end cards | `emblem()` |
| **Hex iris** | the next world opens through a hexagon growing from a point in the shot | wordmark → promise, → CV coach, → end card | `iris()` |
| **Camera dive** | the current layer accelerates toward the camera with blur while the next fades in behind | wordmark → product, dashboard → Learn | keyframes `s`/`z` + `in` |
| **Shatter & reassemble** | the dashboard's eight cards fly apart (problem) and click back into one window (solution) | problem → solution | `dashboardStory()` |
| **Card morph** | a catalog card lifts, glows and grows into the course drawer it opens | Learn | `learn()` |
| **Floor rise** | the next chapter's ground rises from the bottom edge | → Prove, Connect, Grow, solution | `floorIn()` |
| **Data wipe** | a light streak crosses the frame and wipes in the next screen | → Live | `wipe` + `.streak` |
| **Honeycomb converge** | real screen fragments fly into hexagon cells, then collapse into the centre | outcome → brand | `converge()` |
| **Light sweep** | one soft band of light crosses a hero screen | solution hero shot | `sweep()` |
| **Flash** | a 0.1 s ice-blue flash on an impact | wordmark, end card | flash layer |

*Not used:* digital glitch (it would read as broken UI) and spinning transitions.

## Typography motion

- **Kicker → headline.** A Martian Mono kicker ("02 · PROVE · TWO-STAGE REVIEWS") focuses in, then the headline
  rises word by word out of its own masks.
- **Lead-in + keyword** (from the reference): "THE PROBLEM" → **Spreadsheets.** → **Email threads.** → **Side chats.**
  → "Growth gets **lost** in between." Each keyword has an outlined **echo** behind it.
- **Two-line promise:** "YOUR CAREER." then "YOUR NEXT MOVE." in the Frost gradient. One gradient runs across
  the moving words (the runtime aligns each word's slice).
- **Wordmark:** "Career" in white, "Hive" in the light gradient, letters rising with a 35 ms stagger.
- **9:16 beats:** a mono lead-in, a 210 px keyword ("Learn." "Prove." "Live." "Your CV." "Grow." "Together."), a
  vertical outlined ghost along the left edge.

## UI animation system

| Pattern | Real data it animates | Function |
|---|---|---|
| Counter | 97 enrollments · 58 certificates · 4.1 avg team rating · 63 % course progress · 5/8 items · 72 / 56 / 42 % formation matches · 13 skills · 48 % mastery | `counter()`, `stat()` |
| Chart draw-on | weekly activity (left → right) | `wipe` |
| Radar open + sweep | skills mastery map | `iris()` + sweep beam |
| Checklist ticks | CV analysis steps, promotion requirements | tick pops with `back` |
| Tracker fill | Submitted → HR review → Manager decision → Approved | `scaleX` track + node pops |
| Cursor | the product's portal-gun cursor clicks *Final approve* | `cursor()` |
| Notification arrival | bell swing, count 0 → 4, toasts slide in, ping rings | `ping()` |
| Lower third | feature name + one-line purpose | `lowerThird()` |
| Status chip | "Approved" morphs onto the button | chip + `back` |

## Effects (and their limits)

| Effect | Setting | Rule |
|---|---|---|
| Grain | 7 % overlay, re-seeded 24 × per second | always on, never noticeable |
| Vignette | 38 % at the corners | always on |
| Depth blur | ≤ 14 px | only while entering, leaving or receding |
| Glow | signal, scan beam, streak, rings | only on light sources and status |
| Light sweep | soft-light band | once per hero shot |
| Perspective | 2400 px stage | windows tilt ≤ 16° so the UI stays readable |

---

## Toolkit (reusable pieces, `source/toolkit.mjs`)

`focusIn` / `focusOut` · `words` · `chars` · `counter` / `stat` · `lowerThird` · `cursor` (with click ripple) · `ping` ·
`sweep` · `iris` · `wipe` · `hexPath` / `honeycomb` · `crop` / `cover` (regions of the real captures) · `tag` (demo-data
tag) · `scene` (a sequence's time window) · `icon` (Lucide) · `logo` (Simple Icons). The animated logo, title cards,
section transitions, lower thirds, metric counters, notification and timeline animations, CTA, end card and social outro
are all built from these pieces, so they share one language.

---

## Self-critique (and what was changed because of it)

**Would a recruiter stop scrolling?** The 9:16 cut opens on a single light in the dark and has a wordmark on screen by
1.3 s. Each beat changes every 2.4 s with one huge word and a real screen. *Yes, for the first 3 seconds, which is the
part that matters.* The first draft held the problem statement for 4 s on one frame, so it was rebuilt as three
one-word beats with echoes.

**Does it look good on a developer portfolio?** The portfolio cut ends on the architecture (React → Express → MySQL,
live push over SSE) with measured facts: 35 end-to-end API tests, 70 route handlers, 23 tables, live hosting. Then
GitHub and contact. *Yes.*

**Does it show actual product quality?** Every frame is the real UI at 2×. Numbers come from the screens. The demo data
is labelled. *Yes.* The first draft's honeycomb used cut-off text fragments, so it was redone with rings, covers,
the radar and the chart.

**Does the animation explain or distract?** Each move maps to a product fact: the card *becomes* the drawer it opens,
the tracker fills when the manager clicks, the bell counts the toasts that arrive. *Mostly explains.* The opening
honeycomb is the one decorative moment. It is kept short (3 s) and its cells show real product pieces.

**Known limits.** The films are built from high-resolution captures, not screen recordings, so cursor moves are
choreographed rather than captured. The soundtrack is synthesised: clean and licence-free, but not a composed score.
The voice-over is an open neural TTS voice: clear, but a professional voice actor would add warmth.
[03-storyboards.md](03-storyboards.md) lists the recordings and [04-sound-and-music.md](04-sound-and-music.md) the
music that would raise the next version.
