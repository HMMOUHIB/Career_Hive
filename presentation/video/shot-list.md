# Screen recordings to capture

**Setup (all shots)**
- Run the UI in **demo mode** (no `VITE_API_URL`), so every name and number is fictional demo data: `npx vite` without
  `.env.local`, or the scratch config used for the screenshots. For SHOT 07 (live push) use the real backend with two
  test accounts instead.
- Chrome, 1920×1080 window (or 2560×1440 for zoom room), browser zoom 100 %, bookmarks bar hidden, one tab.
- Theme **Frost** unless noted. Windows "animation effects" ON (the app respects reduced motion).
- Record 60 fps with **OBS Studio** (free). Do zooms and camera moves in the editor, not with OS magnifiers.
- The app's own portal-gun cursor is on: move slowly and deliberately. Pause 1 s before every click.
- Record each shot 2–3 times; keep the calmest take.

| # | Duration (use) | What to show | Mouse | Camera / screen move (in edit) | Transition out | Text overlay | Purpose |
|---|---|---|---|---|---|---|---|
| 01 | 3 s | Loading screen: emblem coin-turn, "CareerHive" rises, bar slides (reload the page) | none | locked, slight 102 % → 100 % settle | dissolve to hero gradient | `01-title` | brand intro |
| 02 | 3 s | Sign-in: fill email, click **Sign in** (the portal intro is optional, see IP note) | glide to field, type, click | slow push-in on the form | match-cut on the click | — | how it starts |
| 03 | 4 s | Manager dashboard, scroll gently to the Organisation panel (KPIs, weekly bars, pipelines) | still, then wheel-scroll | vertical parallax drift | cut | — | the payoff, used at the end |
| 04 | 4 s | Employee → Formations → Catalog → open a formation → type a motivation → **Send request** | deliberate path, pause on each target | zoom 115 % on the drawer | cut on "Send" | "Request a formation" | step 1 of the flow |
| 05 | 4 s | Enrolled formation: course content, play the video, tick a file, progress ring updates | click play, then the checkbox | zoom on the player, then pull back | whip-pan (subtle) | `03-lower-formations` | learning with real progress |
| 06 | 4 s | Manager → Review queue → a formation request → **Confirm** (and a promotion card with position/salary) | hover the card, click Confirm | slide from left | cut | `04-lower-reviews` | the two-stage decision |
| 07 | 3 s | Employee window: the bell badge increments and the pop-up appears **without reloading** (backend + 2 accounts, side by side) | none | split-screen, push-in on the bell | cut | `06-lower-notifications` | live push over SSE |
| 08 | 3 s | Team hub: open a conversation, send "Can I join the Kubernetes formation?" | type, press Enter | locked, slight zoom on the thread | cut | `05-lower-chat` | talk where the work is |
| 09 | 4 s | Feed: add a photo, write a line, **Post**, then like it (heart pops) | click Photo, choose file, Post, Like | push-in on the new post | cut | `07-lower-feed` | the social layer |
| 10 | 3 s | Skills evolution radar + weekly bars (employee) | hover a radar point | slow orbit-style pan (2D) | cut | — | analytics |
| 11 | 3 s | Sidebar theme switch Frost → Ember → Light (hold ~0.8 s each) | click each pill | locked | cut on the last switch | "Three themes" | identity & polish |
| 12 | 3 s (optional) | Terminal in `careerhive-backend`: `npm test` ending on "# pass 33 · # fail 0" | none | slow push-in on the summary | cut to night plate | — | proof of quality |
| 13 | 4 s (vertical only) | Phone-size window (390×844): dashboard → feed scroll | touch-like scroll | none | — | — | 9:16 cut |
