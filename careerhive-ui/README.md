# CareerHive — frontend (Ember / Frost redesign)

Vite + React 19, react-three-fiber (3D orb), Framer Motion, Recharts, lucide icons.
Talks to the **CareerHive API** in `../careerhive-backend` (Express + MySQL; setup in its README) — same routes, same payloads.
For local use, put `VITE_API_URL=http://localhost:8000` in `.env.local`.

## Run

```bash
npm install
cp .env.example .env      # set VITE_API_URL to your backend
npm run dev
```

No `VITE_API_URL` → the app runs on an in-browser demo server (`src/api/demo.js`) that mimics
every route, so you can click through the whole flow. Demo logins: any password,
`amine@…` (employee), `hr@…` (HR), `manager@…` (manager).

## Deploy (Vercel)
`vercel.json` rewrites every path to `index.html`, so `/oauth-success?token=…` (Google / LinkedIn /
GitHub callbacks) lands in the app, which stores the JWT and loads `/api/auth/me`.
Keep `FRONTEND_URL` on the backend pointing at this site.

## Map

| Screen | Routes used |
|---|---|
| Login / sign-up | `POST /api/auth/login`, `POST /api/auth/signup`, `GET /api/auth/{google,linkedin,github}` |
| Dashboard | `GET /api/dashboard` (role-aware; staff also get the Organisation panel) |
| Profile (parcours, photo & cover as base64, skills, certificates) | `PUT /api/users/:id`, `/api/skills*`, `/api/certificates*` |
| Request promotion (gated) | `GET/POST /api/promotion-requests` |
| Formations (progress, enrollment requests, create/assign for staff) | `/api/formations*`, `/api/my-formations*`, `/api/formation-requests` |
| Skills evolution | derived from skills + `formation_skills` × progress + certificates + dashboard trends |
| Team comm hub | `GET/POST /api/chat-messages`, `GET /api/teams` |
| Review queue (HR → manager) | `/api/promotion-requests/:id/{hr-review,manager-final-approve,reject}`, `/api/formation-requests/:id/{hr-review,manager-confirm,reject}` |
| Teams (staff) | `POST /api/teams`, `POST /api/teams/:id/members`, `PUT /api/teams/members/:id/feedback` |

## Themes, icons, covers, chat
- **Dark / Light / Frost** — switch in the sidebar, or the sun/moon button in the top bar. First visit follows the OS setting.
- **Formation icons** — real logos (Simple Icons, bundled locally). Set `icon_url` to `https://cdn.simpleicons.org/<slug>`
  (e.g. `kubernetes`, `terraform`, `grafana`), any image URL, or leave it empty and the app matches on title / skills / category.
  Staff get an icon picker in *New formation*. Registry: `src/data/techIcons.js`.
- **Covers** — generated per formation from the logo's brand colour (`src/components/Cover.jsx`), so no image storage is needed.
- **Active now + floating chat** — teammates at the top of the sidebar open a Messenger-style chat window on any page.
  Presence dots use `member.status` (`online | busy | away | off`) when the API sends it; `/api/teams` doesn't yet,
  so add a `status` (or last-seen) column if you want real presence.

## Messenger (Team comm hub)
Three panes like Facebook Messenger: chat list (search, All / Unread / Active filters, active-now row, pinned & muted chats,
unread dots), conversation (grouped bubbles with joined corners, time dividers, emoji-only big messages, hover reactions,
reply-to quotes, typing indicator, Sent/Seen), and a conversation info panel (mute, pin, chat theme colours, quick-reaction emoji,
shared links). The floating chat windows use the same thread (`src/components/Thread.jsx`).
The API stores text only, so reactions, replies, themes, pins and mutes live in the browser for now — add columns
(`reply_to_id`, a `chat_reactions` table, per-user chat settings) to persist them.

## Feed, profiles and follows (LinkedIn-style)
- **Feed** (`/feed`, `src/pages/Feed.jsx`) — your posts and those of the people you follow; a composer for text and one
  photo (resized in the browser; GIFs kept as they are); likes, comments, links made clickable; "People to follow"
  (teammates first) and your follower counts on the side; a "new posts" button when someone you follow posts.
- **Profiles** (`/u/:id`, `src/pages/PublicProfile.jsx`) — anyone's cover, photo, role, bio, skills (with logos),
  certificates, follower counts and posts, with Follow and Message. Your own **Profile** page links to it and has a
  "Your posts" section with the composer.
- Shared pieces live in `src/components/Social.jsx`. Social notifications (follows, likes, comments, new posts) use
  the pink heart in the bell. API routes: see `../careerhive-backend/README.md`.

## Formations: who does what
Employees request and follow formations. **HR and managers run the catalog**: they add, assign (to employees) and remove
formations from the Formations page, and don't see enrollment requests, "My formations" or learning stats themselves.

## Logo and loading screen — the Hamzaoui emblem
- **Logo** — the sidebar and sign-in page show `src/assets/hamzaoui.glb` (`src/three/HamzaouiMark.jsx`, loaded on demand
  through `src/components/Logo.jsx`), tinted with the theme accent (white on the coloured sign-in panel), with
  **CareerHive** under it: each word rises out of a mask, then "Hive" keeps a slow flowing gradient (`.brand-title`).
  The emblem is still apart from a slow CSS float (`.logo-mark`), so it renders on demand; its glow is each theme's
  `--logo-drop` token.
- **Loading screen** — `src/components/Splash.jsx`: the emblem turning like a coin over the title and a progress bar.
  It shows while the session loads, at least 1.6 s and until the emblem has turned about once (never past 3.5 s),
  then fades out onto the app. Timings: `INTRO`, `TURN`, `INTRO_MAX` in `src/App.jsx`.
- The earlier radar logo (`src/three/RadarLogo.jsx`, `src/assets/radar.glb`) is no longer used.

## Mascots — Mouhib and Hamzaoui
`src/three/Mascot.jsx` stages one model per page (its `model` prop; each model loads only where it is used).
Which dashboard gets which is set per role in `MODEL` inside `src/pages/Dashboard.jsx`.

**Mouhib** — the sign-in page and the HR, manager and admin dashboards show `src/assets/mouhib.glb`
(`src/three/Mouhib.jsx`), a rigged character with
a portal gun. The GLB has a single pose and no animations, so all motion is procedural and reacts to the interface:
he enters through a portal (a portal-gun shot splashes it open, he jumps out through its surface, it closes behind
him; skipped with reduced motion); head, chest, eyes and body follow the cursor anywhere on the page; hovering a button, field, link or card makes him aim
the gun at it (pressing it fires); a focused hidden password makes him look away; hovering him twirls the gun,
clicking him spin-jumps, dragging spins him. The lab coat in the GLB is not skinned, so it is bound to the spine
and arm bones at load time. Model: "rick" by Rached.Abdelkhalek on Sketchfab, CC-BY-4.0 (credit required).

**Hamzaoui** — the employee dashboard shows `src/assets/hamzaoui.glb` (`src/three/Hamzaoui.jsx`), a flat
Rick & Morty emblem (210 KB). It spins in, tilts toward the cursor like a coin, and both pairs of eyes follow the
cursor and blink; hovering lifts it and makes it glow, clicking flips it, dragging spins it. It is blue, and turns
white on the frost theme so it stays visible on the blue hero. Model: "Rick and Morty" by Ian Dowson on Sketchfab,
CC-BY-4.0 (credit required).

**Hivy**, the original clay bee built from Three.js primitives (`src/three/Mascot.jsx`), is shown if the model
fails to load. Its poses (`wave`, `laptop`, `clipboard`, `manager`) are picked per role in `POSE` inside
`src/pages/Dashboard.jsx`.

## Course content (videos & files)
- In a formation's panel, **Course content** lists videos, files (PDF, Word, PowerPoint, Excel, ZIP, code, images…)
  and links, each with a coloured type badge.
- Employees: in-app video player with lesson list, auto “completed” at the end of a video, tick files as done.
  Progress follows the content. Not enrolled → items are locked.
- HR / managers / admins: **Manage** → drag-and-drop upload of any file type with a progress bar, add links,
  rename, delete (with confirmation). They can preview everything without enrolling.
- Served by `../careerhive-backend` (uploads are stored in its `UPLOAD_DIR`). A formation without content falls back
  to the manual progress slider.
- Teams: HR/managers add members by **picking an employee account** (search), which links chat and notifications.

## Notifications
- **Bell (top bar)** — count badge, panel grouped Today / Earlier, All / Unread, mark one or all read, click to jump
  (or open the chat). Footer toggles: sound, desktop alerts.
- **Pop-ups** bottom-left when something new arrives (+ soft sound, + desktop notification when the tab is hidden),
  and the tab title shows the unread count, e.g. `(3) CareerHive Workspace`. Muted chats stay quiet.
- **Where they come from**
  - With `../careerhive-backend` → `GET /api/notifications` (real, stored server-side).
  - Without it → derived from what the API already returns: promotion & formation-request decisions, newly assigned
    formations, the HR/manager review queue, and unread chats. Read state is kept per user in the browser.
- Live mode polls every 20 s (chat, notifications, dashboard) and pauses while the tab is hidden.

## Motion & type
- **Portal-gun cursor** — a small, flat gun whose canister is the theme accent, so it is blue on Frost and recolours
  with the theme (`src/components/Cursor.js`, `.cg` in `index.css`). Over anything clickable it tilts up and glows a little;
  a click recoils with a small flash and a thin portal ring. Text fields keep the caret; touch screens use the system cursor.
- **Fonts** (Google Fonts): Bricolage Grotesque (display), Onest (body), Martian Mono (labels), Shippori Mincho B1 (kanji marks).
- **Animated icons** — `Icon` in `src/components/ui.jsx` renders Lucide icons with normalised strokes, so they draw in on mount,
  redraw on hover, and some have their own motion (bell rings, send flies off, flame flickers…). Rules: `.ic` in `index.css`.
- **Section backgrounds** — `src/components/SectionBackground.jsx`, each after a well-known site's hero and kept faint:
  mesh gradient à la Stripe (dashboard), grid spotlight following the cursor à la Linear (profile), rising light beams
  à la Vercel (promotion), dotted globe with arcs à la GitHub (formations), Siri-style ribbons (skills), bokeh (hub),
  dot matrix with ripples (teams), aurora curtains (reviews), point network (people).
  They follow the theme colours, run at ~40 fps, pause in background tabs and respect reduced-motion.
- Headlines reveal word by word, cards have a cursor spotlight and glass surfaces, key cards get an animated gradient border.

## Where to change things
- **Promotion gate rules** — `PROMOTION_RULES` in `src/store/store.jsx`.
- **Themes** — tokens at the top of `src/index.css` (`[data-theme='ember']`, `[data-theme='frost']`).
- **API base / routes** — `src/api/client.js`.

## Backend notes
`../careerhive-backend` fixes what the original `server.js` got wrong: employees only receive their own promotion
requests, certificates are saved with a request, `PUT /api/users/:id` only changes the fields sent, and chat is two-way.
Still open: no skill levels or history are stored, so "Skills evolution" is computed; a `skill_snapshots` table
would make it a true timeline.
