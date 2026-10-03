# CareerHive — presentation system: plan

Source of truth: the code in `../careerhive-ui` and `../careerhive-backend`. Nothing below is invented; anything the code
can't tell us is marked **[INFORMATION NEEDED]**.

---

## 1. Project analysis

**What it is.** CareerHive is a career-growth workspace for a company: employees follow formations (trainings), collect
skills and certificates, and request promotions; HR and managers review those requests in a two-stage workflow and run the
training catalog; everyone talks in a team chat and shares updates in a LinkedIn-style feed.

**Tagline (real product copy):** "Grow on purpose." — the headline of the sign-in page.

**Target users (roles in the code):** Employee (`student`), HR, Manager, Admin, plus the Owner (the account in
`STAFF_EMAILS`) who assigns roles.

**Problems it addresses (design rationale, not measured data):** training, skills, certificates and promotion requests
usually live in separate tools (spreadsheets, email, chat); approvals are opaque; employees can't see what unlocks
their next step; teams have no shared place to talk about their growth.

**Main features (all present in the code):**

| Area | What exists |
|---|---|
| Accounts | Email + password sign-up with email confirmation (single-use tokens stored as SHA-256), password reset, Google / LinkedIn / GitHub sign-in, JWT sessions (7 days), rate-limited auth |
| Roles | New accounts are employees; the owner sets HR / manager / employee and can delete accounts (People & roles) |
| Dashboard | Role-aware: employee hero with promotion readiness; staff see Organisation KPIs, weekly activity, request pipelines, "waiting on you", top skills, departments |
| Formations | Catalog with generated covers and real tech logos; enrollment requests (HR → manager); assignment; course content (video player, files, links, uploads with progress); progress follows finished items; HR/managers add, assign and remove formations |
| Promotions | Gated request (3 completed formations, 1 certificate, 50 % average progress — `PROMOTION_RULES`), HR review → manager final approval that updates the profile, tracker |
| Review queue | Promotions and formation requests, per-stage actions |
| Skills evolution | Mastery radar and weekly activity, derived from skills, formations and certificates |
| Team comm hub | Messenger-style chat (3 panes, floating windows, presence dots, reactions/replies in the browser) |
| Teams | Staff build teams, add members, give feedback and ratings |
| Notifications | Bell with Today/Earlier, pop-ups, sound, desktop alerts, tab-title count; pushed live over Server-Sent Events with a 20 s polling fallback |
| Social | Feed, posts with an image, likes, comments, follow, public profiles, people suggestions |
| CV coach | Profile → Career compass (sidebar: CV coach): upload a PDF / Word / text CV, read on the server (unpdf, mammoth) and never stored; skills, years, seniority and career track found by rules; formations ranked by the gaps they fill, managers by what their teams know; a CV strength score with tips; one saved analysis per person (`cv_analyses`) |
| Visual system | 3 themes (Frost, Ember, Light), 3D mascots (react-three-fiber), 3D emblem logo + loading screen, the CV coach's 3D CV-compass mark, custom portal-gun cursor, 9 animated section backgrounds, animated icons |
| Demo mode | Without `VITE_API_URL` the UI runs on an in-browser mock of every route |

**Architecture.** React 19 SPA (Vite 8) → REST JSON API under `/api` (JWT bearer) + SSE stream → Express 5 on Node 22
→ MariaDB 10.4 / MySQL 8 (23 tables) + local upload storage served at `/uploads` + Gmail SMTP (nodemailer) + OAuth
providers. Deployment is prepared (Vercel rewrite for the UI, Railway/Render notes for the API) —
Live since 2026-10-03 on free tiers: the UI on Vercel (https://career-hive-ebon.vercel.app), the API on Render (https://career-hive.onrender.com), MySQL 8.4 on Aiven.

**AI features:** none. The CV coach is rule-based (no model, no external service), and the book says so.

**Measured facts:** 70 API route handlers + health + SSE stream · 23 tables · 35 end-to-end API tests (node:test, all
passing) · ~9.2k lines in the UI source, ~3.4k in the backend (incl. SQL, scripts and tests) · 13 pages, 20 components, 7 3D
modules · production build: main JS 1.58 MB (452 kB gzip), lazy 3D chunk 911 kB (242 kB gzip), CSS 114 kB (23 kB gzip),
3D models 21 MB (Rick) and 210 kB (emblem).

**What makes it different:** a real two-stage HR → manager workflow wired end to end (requests, decisions,
notifications, profile updates); live notifications over SSE; a product-grade visual layer (themes, 3D, motion) on top
of a tested REST backend; a demo mode that runs the whole UI without a server.

**Strongest visuals:** sign-in with the portal intro, employee dashboard, manager dashboard + Organisation panel,
formation drawer with course content, review queue, team hub, feed and public profile, the three themes.

**IP note (important for publishing):** the 3D mascots and the emblem logo are fan-made models of *Rick and Morty*
characters (models CC-BY-4.0 by Rached.Abdelkhalek and Ian Dowson). The CC-BY licence covers the 3D files, not the
characters. For public marketing (LinkedIn, Instagram, portfolio) the publication brand uses the **CareerHive wordmark**,
and screenshots that show the mascots are captioned as UI; consider replacing the mascots before any commercial use.

**Information needed:** author's full name as it should appear, institution / programme / supervisor (if academic),
GitHub URL, live demo URL, contact, project dates.

---

## 2. Visual identity — "Frost / Ember, on the path"

Derived from the product itself (its themes, fonts, components and workflow):

- **Idea:** a career is a *path of nodes*. The product's tracker (Submitted → HR review → Manager → Approved) and the
  profile timeline become the publication's main graphic device: 2 px tracks with round nodes and icon tiles.
- **Colour logic:** *Frost* (the app's default blue theme) carries the product and the solution; *Ember* (the app's
  dark red theme) is used only for problems and pain points; *Night* (deep navy) for technical pages.
  - Frost Blue `#2F7BF6` · Sky `#5FB2FF` · Indigo `#1C3FC9` · Hero gradient 125° `#6CC4FF → #2F7BF6 → #1C3FC9`
  - Ink `#0E1A2F` · Slate `#56688A` · Mist `#95A3BC` · Paper `#F5F8FC` · Page `#DFE7F3`
  - Night `#071D45 → #0A1530` · Ember `#F2554A` / `#FF8A6B` on `#1B090B`
  - Status (only for states): Good `#14A36B` · Warn `#C98A07` · Bad `#E0453C` · Violet accent `#7B5CFF`
- **Typography (the app's fonts):** Bricolage Grotesque 800 for display (tight tracking), Onest for text, Martian Mono
  uppercase for eyebrows, labels and numbers-as-labels.
- **Wordmark:** "Career" in ink + "Hive" in the flowing Frost gradient — the app's animated title.
- **Grid:** 1920 × 1080 pages, 12 columns, 120 px outer margins, 32 px gutters, 8 px baseline.
- **Cards:** 28 px radius, hairline border, layered shadow tinted blue (the app's `--elev-1`).
- **Icons:** Lucide (the app's set), 1.9 stroke, inside gradient tiles (the app's `IconTile`). Tech logos from Simple Icons.
- **Backgrounds:** the app's section scenes as quiet print textures — dot matrix, constellation network, spotlight grid.
- **Image treatment:** screenshots in a clean window frame (20 px radius, hairline, soft blue shadow); perspective only
  on hero spreads; every screenshot captioned with its route.
- **Diagrams:** nodes = rounded tiles with an icon + label; connectors = 2 px lines, round caps, small arrowheads;
  light version on Paper, luminous version on Night.
- **Data viz:** the app's chart tokens; bars ≤ 24 px, 4 px rounded ends, hairline grids, labels in ink (never in the
  series colour).
- **Section separators:** full-bleed Frost pages with a giant outlined section number and the dot matrix.
- **Motion language (video):** the app's easing `cubic-bezier(.16,1,.3,1)`, word-by-word rise, masked rise of "Hive",
  coin-turn of the emblem, soft cross-fades; no glitch/shake effects.

---

## 3. PDF storyboard (16:9, 1920 × 1080)

| # | Page | Content |
|---|---|---|
| 01 | Cover | Wordmark, "Grow on purpose.", one-line definition, perspective composition of real screens, author / year / stack |
| 02 | Contents | 17 sections with numbers |
| 03 | 01 Project DNA | What it is, the core idea, three pillars: Learn · Grow · Connect |
| 04 | Who it's for | Employee · HR · Manager · Owner — what each does in the product |
| 05 | 02 The problem (Ember) | Pain cards + "scattered tools" before/after diagram (rationale, no statistics) |
| 06 | 03 The solution | Problem → Process → Solution → Result, using the real approval flow |
| 07 | 04 Features — map | Nine feature tiles |
| 08–14 | Feature stories | Promotions · Formations & course content · Review queue · Team hub & live notifications · Feed & profiles · Skills & org analytics — each with screenshot, purpose, benefit, how it works · CV coach (added later: every page after it moved down by one) |
| 14 | 05 User journey | Sign in → Dashboard → Request → Review → Learn → Promotion → Profile updated, with screens |
| 15 | 06 Architecture (Night) | System diagram |
| 16 | 07 Technology stack | Ecosystem by layer with logos and roles |
| 17–18 | 08 Technical highlights | Auth & email confirmation · OAuth · Live notifications (SSE) · Uploads · Role-based workflow · Demo mode |
| 19 | 09 Data model | Entity diagram of the 23 tables, grouped |
| 20 | 10 Design system | Themes, type, components |
| 21 | Annotated UI | Dashboard with numbered callouts |
| 22 | Motion & 3D | Mascots, emblem, cursor, section backgrounds, rules (reduced motion, 40 fps cap, on-demand rendering) |
| 23 | 11 Responsive | Desktop · tablet · mobile |
| 24 | 12 Project journey | Phases, no dates |
| 25–26 | 13 Challenges & solutions | Six real ones |
| 27 | 14 Quality & performance | Real measurements + optimisation strategy |
| 28 | 15 Security | Real measures |
| 29–30 | 16 Showcase | Cinematic full-bleed screens, the three themes |
| 31 | 17 Conclusion + FUTURE ROADMAP | Built · learned · achievements · roadmap (clearly labelled) |
| 32 | Final page | Wordmark, statement, stack, GitHub / demo / contact (placeholders + QR when URLs exist) |

---

## 4. Graphic system (files in `graphics/`)

architecture · data model · user journey · approval workflow · technology ecosystem · feature map · project timeline ·
problem→solution transformation · design tokens sheet · annotated dashboard · device composition. All exported as PNG
(2×) from the same HTML source as the PDF, so they stay identical.

## 5. Publication mockups (`mockups/`)

A. cover as a premium document on a soft Frost floor · B. spread of pages floating in perspective · C. laptop + phone +
PDF composition (original CSS devices, no brand hardware) · D. magazine-style double spread · E. social card.

## 6. Video concept — "Grow on purpose" (45 s)

A calm, precise product film: the path motif draws itself, real screens glide in, each beat answers one question
(what, for whom, how, with what). The product is the hero; stock footage is optional texture, never the subject.

## 7. Video storyboard

See `video/storyboard.md` (0–3 hook · 3–8 intro · 8–14 problem · 14–24 solution flow · 24–38 features · 38–45
architecture + stack · 45–50 end card with CTA; trimmed to 45 s if needed).

## 8. Screen recordings to capture

See `video/shot-list.md` (12 shots with duration, mouse path, camera move, transition, overlay and purpose).

## 9. External assets

See `video/assets.md` (categories, where each appears, duration, style, search keywords, source type, licence notes).

## 10. Deliverables structure

```
presentation/
  PLAN.md                 this file
  QC.md                   final audit
  pdf/                    CareerHive-Project-Book.pdf
  source/                 book.html, social.html, mockups.html, overlays.html, styles, build.mjs, content.json
  assets/screenshots/     real screens (demo data), desktop / tablet / mobile
  graphics/               diagrams and system graphics (PNG)
  pages/                  every PDF page as PNG (for mockups and previews)
  mockups/                A–E
  social/linkedin|instagram|github|portfolio/
  video/                  storyboard.md, shot-list.md, assets.md, editing-plan.md, sound.md, overlays/ (transparent PNG)
```
