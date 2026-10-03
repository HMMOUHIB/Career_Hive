# Quality control — final audit

Audit of every deliverable in `presentation/` against the code in `../careerhive-ui` and `../careerhive-backend`.

## Content

**No invented features.** Each feature in the book traces to code:

| Feature | Where in the code |
|---|---|
| Promotions | `routes/promotions.js`: gate `PROMOTION_RULES` in `store.jsx`; approval runs `UPDATE users SET position, current_salary…`; self-review refused |
| Formations & content | `routes/formations.js`, `routes/resources.js`, `pages/Formations.jsx`, `CourseContent.jsx` |
| Review queue | `pages/Reviews.jsx`, the `hr-review` / `manager-confirm` / `reject` routes |
| Team hub | `routes/chat.js` (contacts per role, keyed by account), `pages/TeamHub.jsx` |
| Live notifications | `notify.js` hub, `routes/notifications.js` stream (retry 5 s, ping 25 s), 20 s polling in `store.jsx` |
| Feed & profiles | `routes/social.js` (magic-byte image check, 6 MB cap, 20-post pages), `components/Social.jsx`, `pages/Feed.jsx`, `pages/PublicProfile.jsx` |
| Skills & analytics | `pages/Skills.jsx`, `pages/OrgPanel.jsx` |
| CV coach | `routes/cv.js` (in-memory upload, 8 MB, one saved analysis per person), `cv/extract.js` (unpdf, mammoth), `cv/analyze.js` (rules for skills, years, track; formation and manager scores with reasons), `components/CvCoach.jsx`, `three/CvCompass.jsx` |
| Accounts & roles | `routes/auth.js` (bcrypt 10, SHA-256 tokens, 24 h / 60 min, OAuth state 10 min, rate limit 30 / 15 min), `routes/users.js` (owner-only roles) |
| Themes, 3D, cursor, backgrounds | `index.css` tokens, `three/*`, `components/Cursor.js`, `components/SectionBackground.jsx` (9 scenes, ~40 fps cap) |
| Demo mode | `api/demo.js` |

**Not claimed:**
- AI: none. The CV coach runs on rules, with no model or external service; the stack page says so.
- GSAP: installed but never imported.
- A live deployment: not verified.

**No invented metrics.** Every number and its source:

| Number | Source |
|---|---|
| 35 tests | `npm test` → `# pass 35 · # fail 0` |
| 70 handlers | `router.get/post/put/patch/delete` count in `src/routes` |
| 23 tables | `CREATE TABLE` count in `sql/schema.sql` |
| 13 pages | files in `src/pages` |
| Bundle sizes | `vite build` output, re-measured at the end; identical hashes |
| Model sizes | the `.glb` files |
| Promotion gate (3 · 1 · 50 %) | `PROMOTION_RULES` |
| Breakpoints (1280 · 1100 · 900 · 820 · 640 · 520) | `index.css` |

- Lighthouse and API latency were **not measured**, and the book says so.

**No invented dates.**
- The project journey is an *order of work*, marked "dates were not recorded".
- The year (2026) comes from `source/content.json`, which you can edit.

**No fake achievements.** "Achievements" lists implemented capabilities only. The future roadmap is labelled **FUTURE ROADMAP — not built yet**.

**Placeholders left as `[INFORMATION NEEDED]`.** Fill them in `source/content.json`, then rebuild:

| Key | What it is | Where it prints |
|---|---|---|
| `context` | institution / programme | cover |
| `github` | repository URL | final page, carousel slide 5, end card; also generates a QR code |
| `demo` | live URL | architecture page, journey page, final page, end card; also generates a QR code |
| `contact` | email or website | final page |

- **Author:** "Mouhib Hamzaoui" was inferred from the account names. Confirm the spelling and order in `content.json`.

## Design

- All 33 pages were reviewed as rendered images, and the fixes were applied. When the CV coach page was added (34 pages), the new and changed pages were reviewed again:
  - cover overlap;
  - solution-page overlap;
  - data-model title collision;
  - design-system overflow;
  - challenge cards overflowing;
  - journey alignment;
  - sparse pages filled;
  - insets zoomed to the relevant region.
- One grid (1920 × 1080, 120 px margins), one type system (Bricolage Grotesque / Onest / Martian Mono) and one icon system (Lucide in tiles) throughout.
- Every page has the section header and a page folio.
- Social, mockups and overlays were reviewed as contact sheets. Fixes: announcement text overlap, carousel slide numbers, architecture fit, notification crop.

## Technical

- **Versions** are read from both `package.json` files at build time (React 19, Vite 8, React Router 7, Framer Motion 13, Three.js 0.186, R3F 9, drei 10, Recharts 3, Express 5, jsonwebtoken 9, bcryptjs 3, Multer 2, express-rate-limit 8, Nodemailer 10, mysql2 3, Node ≥ 20.12).
- **Architecture** matches `app.js`: CORS, JSON 12 MB, `/uploads` static, `/api/auth`, the SSE stream before auth, `requireAuth` + 11 route modules.
- **Data model** matches `schema.sql`. Only column names are shown; no values, secrets or personal data.

## Branding

- The PDF, social kit, mockups and video overlays are built from the same `brand.css`, `lib.mjs` helpers, screenshots and wordmark. They can't drift apart: rebuild with one command.
- The colour logic holds everywhere: Frost = product and solution, Ember = problem only, Night = technical.

## Legal, IP and privacy

- ⚠️ **Rick and Morty IP.** The in-app mascots and emblem logo are fan-made models of copyrighted characters.
  - Their CC-BY-4.0 licence covers the 3D files, not the characters.
  - The publication brand is the CareerHive wordmark.
  - The most public images avoid the mascots: GitHub README hero, portfolio thumbnail and hero, LinkedIn announcement and showcase, mockup C.
  - They still appear in UI screenshots inside the book and in some theme images.
  - Replace the mascots before any commercial use.
- **Credits** are printed on the final page: 3D model authors (CC-BY-4.0), Lucide (ISC), Simple Icons (CC0).
- **Trademarks.** Technology logos are shown only to name the stack; they belong to their owners.
- **Screenshots** use the app's built-in demo data (fictional people), never real accounts. No secrets, tokens or `.env` values appear anywhere. The author's email isn't published: the contact field is a placeholder.
- **Mockup E** is a generic social card, not a copy of any platform's interface.

## Known limits

- The PDF is 24 MB because the screenshots are embedded at 2×, for print. For a lighter share copy, export from a PDF tool with image downsampling (150 dpi), or ask for a `--light` build.
- Screenshots reflect the app on the capture date. After UI changes, re-run `capture.mjs`, then `build.mjs all`.
