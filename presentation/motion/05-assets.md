# 05 · Asset management

## KEEP: existing assets the motion system is built on

| Asset | Where | Why |
|---|---|---|
| 2× captures of the real app (demo data) | `presentation/assets/screenshots/*.jpg` (2880 × 1800) | the source of every product frame: sharp enough to crop 2–3× |
| Product tokens: Frost / Night / Ember colours, Bricolage Grotesque, Onest, Martian Mono, the `cubic-bezier(.16, 1, .3, 1)` ease | `careerhive-ui/src/index.css` → `presentation/source/brand.css` → `motion/source/motion.css` | the films look like the app |
| Lucide icons, Simple Icons logos | `careerhive-ui` dependencies | the product's own icon sets |
| CV-coach mark | `careerhive-ui/src/components/CvMark.jsx`, redrawn in Frost | the "intelligence" act's hero object |
| The product cursor | `careerhive-ui/src/components/Cursor.js` | the click in *Prove* (see the IP note) |
| Synthesised soundtrack engine | `presentation/source/audio.mjs` (extended with gaps and the logo chime) | licence-free sound, cue-accurate |
| The app's logo (3D emblem) | `careerhive-ui/src/assets/hamzaoui.glb`, rendered with `HamzaouiMark.jsx`'s material and lights | the brand mark in the opening and on the end cards |
| The calm 50 s product film | `presentation/video/CareerHive-Film-1080p.mp4` | a slower alternative for long-form contexts; the new master is the kinetic edit |
| Section background renders, social kit, project book | `presentation/assets/screenshots/backgrounds/`, `presentation/social/`, `presentation/pdf/` | same tokens; they sit beside the films in a launch post |

## MODIFY: worth improving

| Asset | Change | When |
|---|---|---|
| Captures | recapture with `presentation/source/capture.mjs` after any UI change, then check the crop rectangles `R` in `source/sequences.mjs` | before re-rendering |
| Portal-gun cursor | swap for a neutral pointer in public or commercial versions (see the IP note) | before commercial use |
| Soundtrack | optionally replace with a licensed composed track ([04-sound-and-music.md](04-sound-and-music.md)) | when publishing widely |
| Cursor moves | replace choreographed moves with real recordings ([03-storyboards.md](03-storyboards.md#optional-live-recordings-for-a-v2-with-real-cursor-motion)) | v2 |

## CREATE: made for the motion system (all in `presentation/motion/`)

| Asset | File |
|---|---|
| Motion engine (keyframes, scene windows, gradient alignment, counters, draw-ons) | `source/toolkit.mjs` |
| Stage styles | `source/motion.css` |
| 12 sequences: opening, promise/problem/solution, Learn, Prove, Live, Connect, CV coach, analytics, Grow, converge, tech, brand | `source/sequences.mjs` |
| 4 cuts + 4 still formats, with their sound cues | `source/cuts.mjs` |
| Renderer, storyboard boards | `source/render.mjs`, `source/boards.mjs` |
| Logo renders: still + 48-frame coin turn, Frost and white | `source/emblem.mjs` → `assets/emblem-*.png` |
| Voice-over: script per cut, speech, stems, captions, voice samples | `VO` in `source/cuts.mjs`, `source/voice.mjs` + `voice.py` → `voice/` |
| Storyboard boards | `storyboard/` |
| 4 films + posters | `video/` |
| Thumbnail, square, portrait, story cover | `graphics/` |
| Documentation | `01`–`06` + `README.md` |

## REMOVE / KEEP OUT OF THE REPO

| Asset | Why | Action |
|---|---|---|
| `careerhive-ui/src/assets/motion.mp4` | **third-party work** (watermark `@alee.gfx_`, "Web Rank Studio"), used only as a reference; not referenced by the app | keep it out of git and never publish it; move it out of `src/` when it's no longer needed |
| `careerhive-ui/src/assets/rickandmorty.jpg` | *Rick and Morty* imagery; not referenced anywhere in the app | delete it unless it's planned for use; never use it in marketing |

Nothing was deleted: these are recommendations.

## IP note (publishing)

The app's logo (the 3D emblem) and its 3D mascots are fan-made models of *Rick and Morty* characters. CC BY 4.0 covers
the 3D files, not the characters, and the product cursor is a portal gun. **At the owner's request the films use the
app's logo** in the opening and on the end cards. The model's licence requires credit, so every end card and still
graphic carries "3D emblem: “Rick and Morty” by Ian Dowson · CC BY 4.0" (also paste it into video descriptions). The
mascots never appear, and the cursor appears once, small, in *Prove*. The characters themselves belong to their rights
holders, so for commercial use replace the logo, mascots and cursor with original designs; the films' code needs only a
new `hamzaoui.glb` and a re-render.

## Production structure

```
presentation/motion/
  README.md                 overview, deliverables, how to render, QC results
  01-reference-analysis.md  the reference, shot by shot, and its CareerHive adaptation
  02-motion-system.md       creative direction, principles, tokens, transitions, type & UI motion, self-critique
  03-storyboards.md         the 4 versions, scene-by-scene timelines, voice-over, shot list, editing plan, thumbnails
  04-sound-and-music.md     sound design, music direction, licensing
  05-assets.md              this file
  06-website-motion.md      implementation plan for motion inside the app
  source/                   toolkit.mjs · motion.css · sequences.mjs · cuts.mjs · render.mjs · boards.mjs · emblem.mjs · voice.mjs · voice.py
  assets/                   emblem-{frost,white}.png + -turn.png sprites (the app's logo, rendered from its 3D model)
  voice/                    {master,portfolio,teaser,social}.flac stems + .srt captions · samples/ (six voices)
  video/                    CareerHive-{Master,Portfolio,Teaser}-16x9.mp4, CareerHive-Social-9x16.mp4, posters
  graphics/                 thumbnail-1280x720, square-1080, portrait-1080x1350, story-cover-1080x1920
  storyboard/               master / portfolio / teaser / social storyboard boards (key frames + scene labels)
```
