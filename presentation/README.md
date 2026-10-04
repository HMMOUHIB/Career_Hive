# CareerHive — presentation system

A publication kit built from the real app: a 34-page project book, diagrams, a social kit, publication mockups and a
video production plan. Everything shares one visual system: the app's own fonts, colours and components.

| Folder | What's inside |
|---|---|
| `pdf/` | `CareerHive-Project-Book.pdf`: 34 pages, 16:9 |
| `pages/` | every book page as an image (previews, mockups) |
| `graphics/` | 15 diagrams at 2×: architecture, data model, user journey, auth flow, stack, timeline, design system, annotated dashboard… |
| `mockups/` | A cover document · B floating pages · C laptop + phone + PDF · D magazine spread · E social card |
| `social/linkedin/` | announcement, 5-slide carousel (PNG + `CareerHive-carousel.pdf` for a document post), showcase, architecture, tech stack, final result, CV coach |
| `social/instagram/` | square 1080, portrait 1080×1350, story 1080×1920 |
| `social/github/` | README hero 1280×640, banner, 4 feature graphics, architecture 1600×900 (used by the repository README) |
| `social/portfolio/` | thumbnail, hero, case-study preview, technology graphic |
| `video/` | **`CareerHive-Film-1080p.mp4`** (50 s, 1920×1080, 30 fps, H.264 + AAC) and its poster; storyboard, shot list, assets, editing plan, sound, and 12 transparent overlays |
| `motion/` | **the motion system**: four kinetic product films (16:9 master 60 s, portfolio 48 s, teaser 25.5 s; 9:16 social 24 s), thumbnails, and the motion design docs; see [`motion/README.md`](motion/README.md) |
| `assets/screenshots/` | the real screens (built-in demo data), desktop / tablet / mobile, plus section backgrounds |
| `source/` | the generator: `brand.css`, `lib.mjs`, `book.mjs`, `kit.mjs`, `build.mjs`, `capture.mjs`, `content.json`; the film: `film.mjs`, `film.css`, `audio.mjs` |
| `PLAN.md` · `QC.md` | the analysis and plan · the final audit |

## Fill in the missing facts

Edit `source/content.json`: `context` (institution / programme), `github`, `demo`, `contact`, and check `author` and
`year`. Empty values print as **[INFORMATION NEEDED]**. Once a URL is set, a QR code is generated for it.

## Rebuild

```bash
# from careerhive-frontend/
node presentation/source/build.mjs all      # or: book | graphics | social | mockups | overlays
```

## Render the film

```bash
# from careerhive-frontend/ — needs ffmpeg with libx264 (on PATH, or FFMPEG=/path/to/ffmpeg)
node presentation/source/film.mjs                         # → video/CareerHive-Film-1080p.mp4 + poster
node presentation/source/film.mjs --stills 9.5,31 --dir X  # single frames, for checking a cut
```

The film is a timeline page rendered frame by frame from the screenshots, so it never drifts from the product. The
soundtrack is synthesised in `audio.mjs` (no third-party music, nothing to license).

## Recapture the screens (after UI changes)

1. Start the UI in demo mode on port 5199, without `VITE_API_URL`, so only fictional demo data appears.
2. Run `node presentation/source/capture.mjs http://localhost:5199`.
3. Run `node presentation/source/build.mjs all`.

The `cv-*.jpg` screens (CV coach) need the real API, since the analysis runs on the server. They were captured against a
scratch database seeded with `db reset --demo`.

Requires Chrome and the `careerhive-ui` dev dependencies (Playwright). Fonts load from Google Fonts during the build.
