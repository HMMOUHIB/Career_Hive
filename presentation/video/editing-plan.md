# Editing blueprint

**Editor:** DaVinci Resolve (free) or CapCut desktop. **Timeline:** 1920×1080, 60 fps (export 30 or 60).
**Grade:** lift shadows toward navy #0A1530, keep whites clean; stock clips −20 % saturation, blue-tinted.
**Type:** use the overlay PNGs (same fonts as the app: Bricolage Grotesque, Onest, Martian Mono). For extra captions, use
Onest 600, white, with a soft navy shadow.
**Motion rules:** the app's easing (ease-out, `cubic-bezier(.16,1,.3,1)`); moves of 5–12 % scale max; no glitch or shake;
at most one camera move per shot.

| Time | Visual | Text | Transition | Sound | Effect |
|---|---|---|---|---|---|
| 0:00 | Night plate, path line draws, 3 nodes pop | "What does it take to get promoted?" (fade up word by word) | — | soft riser starts; low pad | line draw (masked wipe, 1.2 s); node scale 0 → 100 % with slight overshoot |
| 0:03 | SHOT 01 loading screen | `01-title` | cross-dissolve 12 frames | **impact** (soft, low) on the wordmark | 102 → 100 % settle |
| 0:06 | Hero gradient hold | title stays | dip to ember (8 frames) | music kicks in (beat 1) | subtle dot-matrix drift |
| 0:08 | Ember plate + `graphics/problem.png` | `08-problem` | cut on the beat | whoosh (short, airy) | push-in 100 → 108 % over 5 s; the tangled lines pulse once |
| 0:14 | SHOT 04 formation request | "Request a formation" | colour flip ember → frost (luma wipe) | UI click on "Send" | zoom 100 → 115 % on the drawer |
| 0:18 | SHOT 06 review queue | `04-lower-reviews` | cut | click on Confirm | slide-in from left (8 frames) |
| 0:21 | SHOT 07 split screen, bell pops | `06-lower-notifications` | cut | notification "pop" (the app's own sound, or a soft blip) | push-in on the bell; 1-frame white flash on the badge (5 % opacity) |
| 0:24 | SHOT 05 course content | `03-lower-formations` | cut | click on play | zoom to player then pull back |
| 0:27 | SHOT 08 team hub | `05-lower-chat` | cut | keyboard ticks (quiet) | none |
| 0:30 | SHOT 09 feed post + like | `07-lower-feed` | cut | like "pop" | push-in on the new post |
| 0:33 | SHOT 10 skills radar | — | cut | — | slow pan |
| 0:35 | SHOT 11 theme switch ×3 | "Three themes" | hard cuts on each switch (on the beat) | three soft clicks | none — let the app's own transition show |
| 0:38 | Night plate, `10-architecture` builds | — | whoosh-dip to navy | whoosh | cards fade up left → right (4 frames apart), arrows draw |
| 0:42 | `11-stack-strip` slides up (optional SHOT 12 behind) | — | cut | low hit | strip slides 40 px up + fade |
| 0:45 | SHOT 03 org dashboard push-in | — | cross-dissolve | music resolves | 100 → 106 % push |
| 0:47 | `12-end-card` over blurred dashboard | GitHub / Live demo [fill in content.json] | dissolve | final impact + tail | background blur 0 → 20 px |
| 0:50 | end | — | fade to navy | music out (let the tail ring) | — |

**Exports:** master MP4 H.264, 1080p (and 4K if recorded at 1440p), −14 LUFS integrated for social, true peak −1 dB.
Captions: burn in, or upload an SRT for LinkedIn. Re-frame to 9:16 (1080×1920) and 1:1 (1080×1080) with the overlays
moved to centre-bottom.
