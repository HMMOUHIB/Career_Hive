# 06 · Motion inside the app: implementation plan

> **Status: PROPOSED. Nothing here is implemented; the app was not modified.** Each item is small and independent,
> so any of them can be taken on its own.

## What the app already does (audited in `careerhive-ui/src`)

| Area | Implementation | Verdict |
|---|---|---|
| Route transitions | `AnimatePresence mode="wait"` keyed on the path (`App.jsx`); the app frame enters with opacity + scale 0.97 → 1, 0.6 s, `[.16, 1, .3, 1]` | good, and the film's ease matches it |
| Lists and cards | `stagger` / `rise` variants, `Tilt` (spring-driven 3D hover), `Reveal` text, `useSpotlight` (`components/ui.jsx`) | good |
| Numbers | `Counter` eases from 0 when scrolled into view (`useInView`, 1.4 s) | already what the films do |
| Shared elements | `layoutId` on the active nav pill (`Shell.jsx`) and the tab indicator (`ui.jsx`) | good |
| Approval tracker | `Tracker.jsx` fills over 1.1 s and the nodes rise in turn | good, but it animates `width` (see P1) |
| Notifications | badge pops with a spring, panel springs open, items animate `layout` (`NotificationCenter.jsx`) | good |
| Drawer | slides in from the right with a spring and a 2° settle (`Drawer.jsx`) | good |
| Charts | Recharts bars 900 ms, mastery radar 1000 ms (`Charts.jsx`) | good |
| Ambient | 9 canvas section backgrounds, ~40 fps cap, paused when the tab is hidden (`SectionBackground.jsx`) | good |
| 3D | react-three-fiber, lazy chunks, `frameloop` `demand`/`never` off-screen, `dpr [1, 2]`, low-power GL | good |
| Reduced motion | CSS media queries, the cursor, the backgrounds and the 3D scenes respect it… | **…but Framer Motion does not** (no `MotionConfig`) |
| GSAP | `gsap ^3.15` is in `dependencies` but **never imported** | dead dependency |

**Stack decision:** stay on **Framer Motion + CSS**. CareerHive is an app with route and state transitions, not a
scroll-told landing page, so GSAP/ScrollTrigger would add a second animation system for nothing. Three.js is already
used where it earns its weight (911 kB lazy chunk); adding more 3D is not recommended.

---

## P0: accessibility & hygiene

### P0.1 Make every Framer animation respect "reduce motion"
Wrap the app once. Framer then drops transform/layout animations (opacity stays) for users who ask for less motion.

```jsx
// careerhive-ui/src/main.jsx (or around the router in App.jsx)
import { MotionConfig } from 'framer-motion'
<MotionConfig reducedMotion="user"><App /></MotionConfig>
```
*Test:* DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. Pages and drawers should appear without
sliding.

### P0.2 Remove the unused `gsap` dependency
`npm uninstall gsap` in `careerhive-ui` (it is not in the bundle, but it is install weight and a false signal about the
stack). Skip this if GSAP is planned for something specific.

## P1: smoother, closer to the films

### P1.1 Tracker fill on the compositor
`Tracker.jsx` animates `width`, which triggers layout on every frame. Animate `scaleX` instead:

```jsx
<motion.div className="tracker-fill" style={{ transformOrigin: '0 50%', width: '100%' }}
  initial={{ scaleX: 0 }} animate={{ scaleX: (reached - 1) / (stages.length - 1) }}
  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
```
(Check the fill's rounded end: with `scaleX` the radius scales too. If that's visible, keep a fixed-size cap.)

### P1.2 The card morph: a catalog card becomes its drawer
The films' signature move, done for real with a shared element: give the formation cover a `layoutId` in both the
catalog card and the drawer header (`<Cover>` is used in both places, in `pages/Formations.jsx`).

```jsx
<motion.div layoutId={`cover-${f.id}`} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
  <Cover item={f} variant={variant} />
</motion.div>
```
Caveats: the drawer is portalled to `<body>`; `layoutId` still pairs across portals inside one React tree, but test
it with `AnimatePresence` on the drawer. Keep the drawer's own slide for the body content. With P0.1 in place,
reduced-motion users get a fade.

### P1.3 Focus-pull headings
The `Reveal` heading component could arrive like the films' type: words rise from their masks with an 8 px blur
settling to 0. **Only on page titles.** Blur on large surfaces is expensive, so never on whole pages or cards.

## P2: small delights (each 15–30 min)

| Item | Where | Motion | Guardrail |
|---|---|---|---|
| Bell swing | `NotificationCenter.jsx`, when the unread count rises | `rotate: [0, -16, 13, -9, 0]`, 0.5 s, origin top centre | not on first load; off with reduced motion |
| Approved moment | review queue, after *Final approve* | the button morphs into a green "Approved" chip (`layout` + colour) | keep the toast; this is extra feedback |
| Checklist ticks | promotion page | ticks pop in turn (`scale 0.6 → 1`, `back` ease, 80 ms stagger) when a requirement turns green | only on change, not on every visit |
| Light sweep | the employee hero card | one soft-light band crosses it once on load | once per session |

## Not recommended

- Page-wide blur or zoom transitions (cost and motion sickness).
- Parallax on the dashboard (it moves data people are trying to read).
- Hexagon motifs inside the product: the hive geometry is the *publication's* device; the app keeps its own visual
  language.
- Any looping animation on content (only ambient backgrounds loop, and they are already capped and pausable).

## Performance budget & checks

- Animate **`transform` and `opacity`** only; `filter: blur` only on elements under ~600 px wide and only while they
  move.
- No measuring inside animation frames (read layout once, then animate); `will-change` only during the animation.
- 60 fps target on a mid-range laptop with DevTools CPU throttling at 4×; check *Rendering → Frame rendering stats*
  and *Performance* for long tasks during route changes.
- Re-run Lighthouse (performance + accessibility) after each item; the reduced-motion emulation must leave every
  screen usable.
