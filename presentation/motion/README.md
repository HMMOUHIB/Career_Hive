# CareerHive · motion system

Four kinetic product films with a voice-over, and their graphics, built from the **real app** (2× captures, built-in
demo data) and the app's own 3D logo, with a motion language studied from a reference reel and rebuilt in CareerHive's
own colours, fonts and hexagon motif.

## Deliverables

| File | Format | Length | Size | Use |
|---|---|---|---|---|
| [`video/CareerHive-Master-16x9.mp4`](video/CareerHive-Master-16x9.mp4) | 1920 × 1080 · 30 fps | 60 s | 38.2 MB | YouTube, LinkedIn video, README, demos |
| [`video/CareerHive-Portfolio-16x9.mp4`](video/CareerHive-Portfolio-16x9.mp4) | 1920 × 1080 · 30 fps | 48 s | 30.7 MB | portfolio case study; ends on the architecture, GitHub and contact |
| [`video/CareerHive-Teaser-16x9.mp4`](video/CareerHive-Teaser-16x9.mp4) | 1920 × 1080 · 30 fps | 25.5 s | 16.2 MB | autoplay previews, the start of a talk |
| [`video/CareerHive-Social-9x16.mp4`](video/CareerHive-Social-9x16.mp4) | 1080 × 1920 · 30 fps | 24 s | 15.4 MB | Reels, Shorts, TikTok, Stories, LinkedIn mobile |
| `video/*-poster.png` | same as the film | none | none | covers / end-card stills |
| `graphics/thumbnail-1280x720.png` · `square-1080.png` · `portrait-1080x1350.png` · `story-cover-1080x1920.png` | PNG | none | none | video thumbnail, post images, Reel cover |
| `storyboard/{master,portfolio,teaser,social}-storyboard.png` | PNG | none | none | key frames of each cut with time and scene: for reviews, decks, the case study |
| `voice/{master,portfolio,teaser,social}.srt` | SubRip | none | none | **captions** to upload with each film (YouTube, LinkedIn) |
| `voice/*.flac` · `voice/samples/*.wav` | audio | none | none | the voice-over stems (for remixing) · six candidate voices to compare |
| `assets/emblem-{frost,white}.png` · `*-turn.png` | PNG | none | none | the app's logo rendered from its 3D model: still and 48-frame coin turn |

All films: H.264 High 4.2 (CRF 20, ≤ 6 Mb/s), AAC 192 kb/s 48 kHz, bt709, fast start, a voice-over over the music
(which ducks under it). They still work muted (the story is on screen, and captions are provided) and carry a quiet
**REAL UI · DEMO DATA** tag while product screens are visible. The app's logo (the 3D emblem) coin-turns into the
opening, like the app's loading screen, and leads every end card.

## Documents

| | |
|---|---|
| [01 · Reference analysis](01-reference-analysis.md) | the reference reel shot by shot: camera, transition, type, effect, pacing, why it works, the CareerHive version |
| [02 · Motion system](02-motion-system.md) | creative direction, principles, tokens, transition vocabulary, typography and UI motion, effects, self-critique |
| [03 · Storyboards](03-storyboards.md) | the four versions, scene-by-scene timelines, the voice-over script, shot list, live-recording list, editing plan, thumbnails |
| [04 · Sound & music](04-sound-and-music.md) | the voice-over, the synthesised score and sound design, the mix, music direction, royalty-free sources and licensing |
| [05 · Assets](05-assets.md) | KEEP / MODIFY / CREATE / REMOVE, the IP note, the folder structure |
| [06 · Website motion](06-website-motion.md) | audit of the app's animation and a prioritised plan (**proposed, not implemented**) |

## What's real and what isn't

- Every screen is the real UI; every number on screen is the value on that screen (demo data, labelled as such).
- Every feature shown exists in the code: formations and course content, the two-stage HR → manager review, live
  notifications over SSE, team chat and feed, the **rule-based** CV coach (no AI model), skills analytics, promotions.
- Technical figures in the portfolio cut were checked against the code: 35 end-to-end API tests, 70 API route handlers
  (plus health and the SSE stream), 23 tables, React 19 · Vite 8 · Express 5 · MySQL 8, live on Vercel · Render · Aiven.
- Cursor moves are choreographed over captures, not screen recordings.
- The soundtrack is synthesised in code: no licences involved.
- The voice is **synthetic**: Kokoro, an open text-to-speech model (Apache-2.0) run locally, voice `am_michael`. It is
  an original stock voice, not an imitation of anyone.
- The logo is the app's 3D emblem, rendered with the app's own material and lights. Its model is "Rick and Morty" by Ian
  Dowson (CC BY 4.0); the credit is on every end card and still graphic. See the IP note in [05-assets.md](05-assets.md).
- The reference reel (`careerhive-ui/src/assets/motion.mp4`) is third-party work: it was only studied, nothing from it is
  in these files, and it should not be committed or published ([05-assets.md](05-assets.md)).

## Render

From `careerhive-frontend/`. Needs Chrome, the `careerhive-ui` dev dependencies (Playwright), network access for
Google Fonts, and ffmpeg with libx264 (on `PATH`, or `FFMPEG=/path/to/ffmpeg`).

```bash
node presentation/motion/source/voice.mjs               # 1. speak the voice-over → voice/*.flac + *.srt (skip to keep the current ones)
node presentation/motion/source/render.mjs master       # 2. render: or portfolio | teaser | social; add --no-voice for music only
node presentation/motion/source/render.mjs stills       # the four graphics
node presentation/motion/source/render.mjs all          # everything (~25 min)
node presentation/motion/source/render.mjs master --stills 3,9.5,23.6 --dir out   # single frames, for checking
```

Each frame is `seek(t)` on a timeline page, captured at 30 fps and piped to ffmpeg with the soundtrack
(`presentation/source/audio.mjs`). A 60 s cut takes about 8 minutes.
After rendering, `node presentation/motion/source/boards.mjs` rebuilds the storyboard boards from the films.

No ffmpeg on this machine's `PATH`: `npm install --prefix tools ffmpeg-static`, then set
`FFMPEG=tools/node_modules/ffmpeg-static/ffmpeg.exe`.

**Voice-over:** `pip install kokoro-onnx soundfile` (set `PYTHON` if that isn't the default `python`), put
`kokoro-v1.0.onnx` and `voices-v1.0.bin` from the [kokoro-onnx model release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0)
in `KOKORO_DIR` (default `~/.cache/kokoro-onnx`). The script and timings are `VO` in `source/cuts.mjs`; `voice.mjs`
refuses lines that run into the next one. Another voice: listen to `voice/samples/`, then
`VOICE=am_fenrir node presentation/motion/source/voice.mjs` and re-render.
**Logo:** `node presentation/motion/source/emblem.mjs` re-renders the emblem from `careerhive-ui/src/assets/hamzaoui.glb`.

**Change something:** scenes live in `source/sequences.mjs` (one function per scene, crop rectangles in `R` at the
top), cuts and their sound cues in `source/cuts.mjs`, the engine and reusable pieces in `source/toolkit.mjs`, styles
in `source/motion.css`. After a UI change, recapture the screens first (`presentation/README.md`).

## Quality check

Checked on the final files (2026-10-03):

| | Master | Portfolio | Teaser | Social |
|---|---|---|---|---|
| Duration | 60.00 s | 48.00 s | 25.50 s | 24.00 s |
| Video | 1920 × 1080, 30 fps, H.264 High, bt709 | same | same | 1080 × 1920, same |
| Bitrate | ≈ 5.1 Mb/s | ≈ 5.1 Mb/s | ≈ 5.1 Mb/s | ≈ 5.1 Mb/s |
| Loudness | −15.1 LUFS | −14.9 LUFS | −15.0 LUFS | −14.7 LUFS |
| True peak | −1.0 dBFS | −0.9 dBFS | −1.3 dBFS | −1.0 dBFS |

- **Picture:** every scene reviewed at 1 frame/s, every transition seam frame by frame (no black frames or uncovered
  corners), plus frames decoded from the final MP4s.
- **Content:** every feature shown exists in the code; every final counter value matches its screen (97 · 58 · 4.1 ·
  63 % · 5/8 · 72 / 56 / 42 % · 13 · 48 % · 2 · 2); no AI claims; technical figures verified (35 tests, 70 route
  handlers, 23 tables); the demo-data tag is on every product scene and on the still graphics.
- **Brand:** the product's colours and fonts only; Ember red only in the problem act; the app's emblem only in the
  opening and on the end cards (with its model credit); the 3D mascots never appear.
- **Size:** every film is under 40 MB (GitHub-friendly, and well inside LinkedIn, YouTube and Instagram limits).
- **Iterations after review:** the opening's later scenes showed through (scene windows added); gradient words
  rendered blank (per-span gradient alignment); the problem act held one frame for 4 s (rebuilt as one word per beat
  with echoes); the honeycomb showed cut-off text (visual crops); transitions left black strips (scene overlaps);
  section numbers skipped in the portfolio cut (numbers per cut); bitrate pushed the master to 169 MB (capped);
  translucent stat cards on the stills (opaque); the social *Prove* beat was half empty (approval tracker added).
