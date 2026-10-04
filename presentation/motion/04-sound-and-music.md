# 04 · Sound design & music direction

The four films carry a soundtrack **synthesised in code** (`presentation/source/audio.mjs`, shared with the earlier
product film). No third-party music or samples, so there is nothing to license. Each cut lists its sound cues next to
its picture (`cues` in `source/cuts.mjs`), so every sound lands on the frame it belongs to.

## The voice-over

| | |
|---|---|
| Voice | **Kokoro** `am_michael`: an open neural text-to-speech model (Apache-2.0 weights) run locally; an original stock voice, not an imitation of any person or character. Alternatives to compare: `voice/samples/` (am_michael, am_fenrir, am_puck, bm_george, af_heart, af_bella) |
| Direction | calm, confident, warm; short declarative lines; the problem words and "Learn. Prove. Grow." spoken as they land on screen |
| Timing | `VO` in `source/cuts.mjs`: one start time per line, placed on its scene; `voice.mjs` measures every spoken line and refuses any that runs into the next |
| Voice chain | silence trimmed per line → placed at its time → high-pass 80 Hz → compressor 3:1 at −20 dB → loudness −16 LUFS → 48 kHz mono stem (`voice/<cut>.flac`) |
| Mix | the music bed ducks under the voice (sidechain compressor, threshold −26 dB, ratio 4:1, 20 ms attack, 400 ms release ≈ 9 dB of ducking while speaking), then the full mix is normalised to **−14 LUFS**, true peak −1.5 dB |
| Captions | `voice/<cut>.srt`, same lines and times: upload them with the films |
| Music only | `render.mjs <cut> --no-voice` |

## The score: built in layers that follow the story

| Layer | What it is | Enters | Story role |
|---|---|---|---|
| Pad | warm chords, Cmaj9 → Am9 → Fmaj9 → G6/9, one chord per 2 bars (4.8 s) at **100 BPM**, three detuned voices | 0 s | the dark before the signal |
| Riser | filtered noise sweeping 300 Hz → 7 kHz | 0 → 3.0 s | tension into the wordmark |
| Arpeggio | plucked eighth notes with a ping-pong echo | the wordmark hit (3.0 s) | the product wakes up |
| Kick + sub bass | soft kick on beats 1 and 3, sidechained sub on the chord roots | the solution beat (12.0 s) | momentum: "it works" |
| Shaker | light off-beat noise | the feature run | detail, motion |
| Drop-out | everything stops for the end card's chime | the end card | resolution |

The cuts sit on the same 0.6 s beat grid as the music, so scene changes land on bar lines without manual syncing.

## Sound design (synchronised to the picture)

| Sound | Synthesis | Used for | Rule |
|---|---|---|---|
| **Gap** | music fades out in 50 ms and stays silent until the hit | 0.14 s before every major hit | taken from the reference: silence before a new idea |
| **Impact** | 52 Hz sine thump + a noise down-sweep | wordmark, end card | 2 per film, never more |
| **Whoosh** | 0.7 s band-passed noise swell | scene transitions (iris, floor, wipe, dive) | one per transition |
| **Soft whoosh** | 0.4 s, quieter | secondary moves (card morph, problem payoff, honeycomb) | |
| **UI click** | 1.9 kHz + 3.6 kHz transient, 40 ms | the cursor's click on *Final approve* | only on a visible click |
| **Pop** | two notes, 880 → 1320 Hz | notifications arriving, *Approved* chip, a like | one per arrival |
| **Tick** | 1250 Hz blip, 80 ms | counters, checklist ticks, hive cells, the problem words | quiet, rhythmic |
| **Logo chime** | soft FM bell on C – E – G – C, notes 35 ms apart | end card | once |

**Music mix:** 48 kHz stereo; fade-in 0.25 s and fade-out 2.2 s; gentle `tanh` saturation; peaks normalised to −1 dBFS
before the voice is mixed in. Loudness of the final films is measured in [README.md](README.md#quality-check).

## Music direction (to replace the synth score with a composed track)

Brief for a composer or a library search:

- **Style:** cinematic electronica / future-garage-leaning ambient. Warm pads, a plucked or mallet arpeggio, soft
  kick, airy textures. Optimistic and precise, not epic-trailer, not "corporate ukulele".
- **Tempo:** 100 BPM (keeps every cut on a bar line); 96–104 BPM works with a small retime.
- **Shape (60 s):** 0–3 s near-silence + riser → 3 s hit → 3–12 s sparse (arp only) → 12 s drums enter → 12–48 s
  steady build, one new element every 8 bars → 48–53 s lift → 53 s resolve on a clean chord, ring out.
- **Key:** major / Lydian colour (C major here), no minor-key drama.
- **Avoid:** vocals, dubstep drops, generic "inspiring corporate" piano loops, anything that competes with the clicks.

**Search keywords** (royalty-free libraries): `cinematic electronic build 100 bpm` · `future garage ambient` ·
`minimal synth arpeggio optimistic` · `tech product launch music` · `ambient electronica uplifting no vocals` ·
`soft pulse innovation`.

**Where to look.** Free: YouTube Audio Library, Pixabay Music, Free Music Archive (CC). Freemium: Uppbeat, Mixkit.
Paid: Artlist, Musicbed, Epidemic Sound. **Check every track's own licence before publishing.** Some free tracks
require attribution in the description; CC-NC tracks cannot be used commercially. Never use commercial songs: a
LinkedIn or YouTube upload with copyrighted music can be muted or taken down.

**SFX keywords**, if the synthesised hits are swapped for samples: `ui click soft` · `whoosh air short` ·
`sub drop cinematic` · `riser tension 3 seconds` · `notification pop` · `digital tick` · `glass chime logo`. Sources:
freesound.org (prefer CC0), Pixabay sound effects, Mixkit, Zapsplat (free tier needs attribution).

**Swapping the score in** (keeps the voice-over, ducks the new track under it like the render does):

```bash
ffmpeg -i video/CareerHive-Master-16x9.mp4 -i track.wav -i voice/master.flac -filter_complex \
  "[2:a]aformat=channel_layouts=stereo,asplit=2[vo][key];[1:a][key]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=400[bed];[bed][vo]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest out.mp4
```
This replaces the synthesised music *and* its sound effects (the pad always plays, so the effects cannot be kept on
their own without a small change to `audio.mjs`). Recreate the key hits in the new mix: wordmark 3.0 s, approve click
23.6 s, end card 53.1 s in the master.
