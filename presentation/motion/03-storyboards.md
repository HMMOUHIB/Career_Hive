# 03 · Versions, storyboards, shot list & editing plan

Every version is rendered from the same scenes (`source/sequences.mjs`), assembled per cut in `source/cuts.mjs`.
Visual boards of each cut (key frames, times, scenes) are in [`storyboard/`](storyboard/).

## The four versions

| | **Master** | **Portfolio / recruiter** | **Teaser** | **Social** |
|---|---|---|---|---|
| File | `video/CareerHive-Master-16x9.mp4` | `video/CareerHive-Portfolio-16x9.mp4` | `video/CareerHive-Teaser-16x9.mp4` | `video/CareerHive-Social-9x16.mp4` |
| Format | 1920 × 1080, 30 fps | 1920 × 1080, 30 fps | 1920 × 1080, 30 fps | 1080 × 1920, 30 fps |
| Length | 60 s | 48 s | 25.5 s | 24 s |
| For | YouTube, LinkedIn video, the README, demo days | the portfolio's case study; a recruiter with one minute | a link preview, X/LinkedIn autoplay, the start of a talk | Reels, Shorts, TikTok, LinkedIn mobile, Stories |
| Story | full arc: problem → solution → 7 features → converge → brand | the arc, the 4 strongest features, **under the hood**, contact | hook → 3 proofs → brand | one word per 2.4 s beat |
| Ends on | URL + credit | URL + GitHub + email + credit | URL + credit | URL + credit |
| Voice & captions | voice-over (see below) + `voice/master.srt` | same + `portfolio.srt` | same + `teaser.srt` | same + `social.srt`; on-screen text inside the 9:16 safe area |
| Codec | H.264 High 4.2, CRF 20 (≤ 6 Mb/s), AAC 192 kb/s 48 kHz, bt709, faststart | same | same | same |

Each has a poster PNG next to it (the end card, fully built).

---

## Master: scene by scene (60 s)

| Time | Scene | Picture | Text on screen | In / out | Sound |
|---|---|---|---|---|---|
| 0.0–3.0 | **Signal** | black → Night; a point of light flares; a hexagon draws itself; the hive grows ring by ring and real fragments fill it (3/4 ring, 63 % ring, CV 90, radar, KPI card, avatars, skill chips); everything collapses into the light | none | none | riser from 0; ticks on the cell pops · VO "Every career starts with one step." |
| 3.0–4.8 | **Logo** | flash; the hive becomes the app's **emblem**, which coin-turns once (the app's loading screen); *CareerHive* letters rise beneath it inside a hexagon; then logo and wordmark dive into the camera | CareerHive · GROW ON PURPOSE | **hex iris** opens on paper (3.95) | impact + gap at 3.0; arpeggio enters |
| 4.8–7.2 | **Promise** | the manager dashboard drifts in 3D perspective | YOUR CAREER. / YOUR NEXT MOVE. | none | whoosh 7.2 |
| 7.2–12.0 | **Problem** | the dashboard **shatters** into its 8 cards, which drift apart | THE PROBLEM → Spreadsheets. → Email threads. → Side chats. → Growth gets **lost** in between. | none | ticks on each word; soft whoosh on the payoff |
| 12.0–16.8 | **Solution** | **Frost floor** rises; the cards fly back and click into one window; hero shot: the window tilts, its layers lift, a light sweep crosses it | THE SOLUTION · CAREERHIVE / One place for every step. · counters 97 enrollments · 58 certificates · 4.1 avg team rating | **camera dive** into the next scene | gap + whoosh at 12.0; kick and sub bass enter |
| 16.8–21.9 | **01 Learn** | the catalog; the Kubernetes card lifts and glows, then **morphs** into its course drawer | lower third *Formations & course content* · 63 % course progress · 5/8 items finished | none | whoosh; soft whoosh on the morph |
| 21.6–26.7 | **02 Prove** | **floor rise**; the manager's review form; the cursor clicks *Final approve*; the button becomes *Approved*; the 4-stage tracker fills | HR forwards. The manager decides. | none | click + pop at 23.6 |
| 26.4–31.5 | **03 Live** | **data wipe** with a light streak; the bell swings and counts to 4; four toasts slide in, each with a ping; the notification centre | Everyone hears it the moment it moves. | none | four pops |
| 31.2–36.4 | **04 Connect** | **floor rise**; typing dots → chat bubbles; a feed post rises; a like pops | Talk with the team. Share the wins. | **hex iris** to Night | pops |
| 36.0–41.0 | **05 CV coach** | the CV mark is read by a scanning beam inside a turning dashed ring; 5 analysis steps tick; the result card rises | Upload a CV. Find your next step. · 72 % · 56 % · 42 % formation matches | none | gap + whoosh; five ticks |
| 40.8–45.9 | **06 Skills & analytics** | KPI cards; the radar opens from its own centre and a beam sweeps it; weekly activity draws itself | Skills you can see. Teams at a glance. · 13 · 48 % · 2 · 2 | **floor rise** to paper | whoosh |
| 45.6–48.1 | **07 Grow** | the promotion checklist rows light up in turn; the history's *Approved* badge rings | Every step counts toward your next role. | none | three ticks |
| 48.0–53.1 | **Converge** | seven hexagon tiles of real screens fly into a honeycomb, then collapse into the centre; a soft flash | Learn. Prove. **Grow.** | **hex iris** to Frost | soft whooshes; gap |
| 52.8–60.0 | **Brand** | the white emblem coin-turns in above the wordmark, inside a flat hexagon; a ghost "HIVE" behind | CareerHive · Grow on purpose. · A modern career-growth workspace. · career-hive-ebon.vercel.app · Mouhib Hamzaoui · 2026 · the emblem's model credit | fade to black 59.25 → 60 | impact + logo chime at 53.1 · VO "CareerHive. Grow on purpose." |

## Portfolio / recruiter (48 s)

0–17 s are the same as the master (signal → wordmark → promise → problem → solution). Then:
**01 Learn** (16.8) → **02 Prove** (21.6) → **03 CV coach** (26.4) → **04 Skills & analytics** (31.2) →
**Under the hood** (36.0): Browser (React 19 · Vite 8 · Three.js) → API (Express 5 on Node.js, REST · JWT · SSE) →
Database (MySQL 8 · 23 tables), a live-push arc labelled *Server-Sent Events*, counters for **35** end-to-end API tests,
**70** API route handlers and **23** tables, and *Live on Vercel · Render · Aiven* →
**End card** (40.8) with the URL, **GitHub @HMMOUHIB** and **hamzaouimoh54@gmail.com**.

## Teaser (25.5 s)

| Time | Beat |
|---|---|
| 0–4.9 | Signal → hive → wordmark → dive |
| 4.8–9.9 | **01 Prove**: the manager approves, the tracker fills |
| 9.6–14.8 | **02 Live**: the bell, the toasts |
| 14.4–19.75 | **03 CV coach**: the scan, the plan, 72 / 56 / 42 % |
| 19.2–25.5 | End card, fade |

## Social 9:16 (24 s): one word per bar

| Time | Lead-in | Keyword | Picture | Ground |
|---|---|---|---|---|
| 0–2.5 | none | CareerHive | signal → hive → wordmark | Night |
| 2.1–4.8 | CareerHive | YOUR CAREER. YOUR NEXT MOVE. | the dashboard rising in perspective | Paper (hex iris) |
| 4.8–7.2 | Formations & courses | **Learn.** | the Kubernetes course card · 63 % | Frost floor |
| 7.2–9.6 | HR forwards · manager decides | **Prove.** | review form, cursor clicks, *Approved*, the 4-stage tracker fills | Paper (hex iris) |
| 9.6–12.0 | Notifications in real time | **Live.** | three toasts with pings | Frost floor |
| 12.0–14.4 | Finds your next step | **Your CV.** | career-compass card · 72 / 56 / 42 % | Night (hex iris) |
| 14.4–16.8 | Skills you can see | **Grow.** | the skills radar opening from its centre | Paper floor |
| 16.8–19.2 | Team chat & feed | **Together.** | chat bubbles, a like | Frost floor |
| 19.2–24 | none | CareerHive · Grow on purpose. | URL, credit | Frost (hex iris) |

Safe area: nothing important within 250 px of the bottom (platform UI) or 150 px of the top.

---

## Shot list: the source footage

The films are built from **2× captures of the real app** in demo mode (`presentation/assets/screenshots/`, 2880 × 1800),
cropped and animated in the page. These are the shots each scene uses:

| # | Capture | Region shown | Scene | Duration on screen |
|---|---|---|---|---|
| 01 | `org-panel.jpg` (manager dashboard) | full panel; its 8 cards separately | promise, problem, solution, opening cell | ~12 s |
| 02 | `formations-catalog.jpg` | catalog grid; the Kubernetes card; covers | Learn, converge, social | ~5 s |
| 03 | `formation-drawer.jpg` | course drawer; 63 % ring | Learn, opening, converge | ~3 s |
| 04 | `reviews.jpg` | manager's final-approval form | Prove | ~4.5 s |
| 05 | `notifications.jpg` | four toasts; the notification centre | Live | ~4.5 s |
| 06 | `team-hub.jpg` | two chat bubbles | Connect | ~3.5 s |
| 07 | `feed.jpg` | a post with an image | Connect | ~2.5 s |
| 08 | `cv-loading.jpg` | the 5 analysis steps | CV coach | ~2 s |
| 09 | `cv-results.jpg` | career-compass card; CV strength 90 | CV coach, opening, converge | ~3 s |
| 10 | `skills.jpg` | KPI values; mastery radar | Skills, Grow (social), converge | ~4 s |
| 11 | `promotion.jpg` | checklist; history; 3/4 ring | Grow, opening, converge | ~2.5 s |

**To refresh them** after a UI change: run the UI in demo mode and run `presentation/source/capture.mjs` (see
`presentation/README.md`), then re-render. The crop rectangles live in `R` at the top of `source/sequences.mjs`.

### Optional live recordings (for a v2 with real cursor motion)

Record at 2560 × 1440 or 1920 × 1080, 60 fps, demo mode, Frost theme, browser chrome hidden, cursor size 1.5×. Let
every action settle for 1 s before and after.

| Shot | What to show | Mouse | Camera in edit | Overlay | Purpose |
|---|---|---|---|---|---|
| R1 · 6 s | sign-in page: the portal intro and the 3D logo | still, then into the email field | slow push 1.0 → 1.06 | none | the product's own opening |
| R2 · 5 s | dashboard load, the counters counting | still | none | none | real counters, real easing |
| R3 · 6 s | Formations → open Kubernetes → scroll the course content | a straight, slow move to the card | follow the drawer | lower third 01 | the card morph, for real |
| R4 · 5 s | review queue → *Final approve* | an arc to the button, a 0.4 s hover, a click | 1.15× crop on the button | "Approved" chip | the decision moment |
| R5 · 5 s | a second browser receives the notification (SSE) | none | split screen | "live · no refresh" | proof that it's live |
| R6 · 6 s | CV coach: drop a PDF → steps → result | drag the file in | push on the result card | 72 / 56 / 42 % | the "intelligence" act |
| R7 · 4 s | the theme button: Frost → Ember → Light | three clicks | none | none | the design system |
| R8 · 6 s | mobile (390 × 844): dashboard → menu → feed | touch emulation | inside a phone frame | none | responsive |

---

## Editing plan (how the cuts are put together)

- **Timeline = a web page.** Each frame is `seek(t)` on a 1920 × 1080 (or 1080 × 1920) stage, captured at 30 fps
  and piped to ffmpeg. There are no editing presets to drift: the same code renders every version.
- **Overlap rule.** Each scene owns its *incoming* transition and starts 0.3–0.85 s before its beat. The outgoing
  scene stays until the incoming floor or iris has covered the frame.
- **Rhythm.** 16:9 feature scenes are 2 bars (4.8 s): entrance 0.6 s, read 3.6 s, exit 0.6 s. 9:16 beats are 1 bar.
- **Text timing.** A headline is on screen ≥ 1.4 s after its last word lands (reading speed ≈ 3 words/s).
- **Numbers.** A counter starts 0.1 s after its card lands and finishes 0.4 s before the card leaves.
- **Grading.** Done in design: Frost on paper for product scenes, Night for technical ones, Ember only in the problem.
  Grain 7 % + vignette sit on top of everything.
- **Export.** H.264 High, CRF 20 capped at 6 Mb/s, AAC 192 kb/s, faststart. Upload the 16:9 cuts as-is; on Instagram
  use the 9:16 cut with its poster as the cover.

## Voice-over (in the films)

Spoken by Kokoro (`am_michael`, calm and confident, ≈ 150 wpm), timed in `VO` in `source/cuts.mjs` so every line sits
on its scene; `voice.mjs` refuses any line that runs into the next. The exact lines and times of every cut are in
`voice/*.srt`. The master:

> *(0:00)* Every career starts with one step. *(0:05)* Your career. Your next move. *(0:07)* Spreadsheets. Email threads.
> Side chats. *(0:10)* Growth gets lost in between. *(0:12)* CareerHive puts every step in one place. *(0:17)* Learn with
> formations and real course content. *(0:20)* Progress follows what you finish. *(0:22)* HR forwards it. Your manager
> decides. *(0:27)* Everyone hears it the moment it moves. *(0:29)* Live. No refresh needed. *(0:31)* Talk with your
> team, and share the wins. *(0:36)* Upload a CV. The coach reads it, and finds your next step. *(0:41)* See your skills,
> and your team, at a glance. *(0:46)* Every step counts toward your next role. *(0:48)* Learn. Prove. Grow.
> *(0:53)* CareerHive. Grow on purpose.

The portfolio cut swaps the middle for the CV coach, skills and "Under the hood: React, Express, MySQL. Live updates,
tested end to end."; the teaser and the 9:16 cut use shorter lines (one per beat).

---

## Thumbnail & social graphics (`graphics/`)

| File | Size | Concept |
|---|---|---|
| `thumbnail-1280x720.png` | YouTube / LinkedIn video cover | Frost ground, the wordmark top-left, "Grow on purpose.", the dashboard tilted in 3D on the right, two real stats as cards (97 enrollments, CV strength 90), a "Product film · live app" chip |
| `square-1080.png` | Instagram / LinkedIn post | wordmark + tagline, the dashboard tilted, two stat cards |
| `portrait-1080x1350.png` | Instagram portrait post | the same system, taller, with the URL |
| `story-cover-1080x1920.png` | Reel / Story cover | the same system with the URL chip in the safe area |

The posters of the four films (`video/*-poster.png`) double as end-card graphics. The existing kit in
`presentation/social/` (LinkedIn carousel, GitHub banner, portfolio images) uses the same tokens.
