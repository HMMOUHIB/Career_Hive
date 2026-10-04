// The films' voice-over. Lines and their times live with each cut (`vo` in cuts.mjs); this speaks them with Kokoro
// (voice.py), checks that every line ends before the next one starts, and writes one voice stem per cut to voice/,
// which render.mjs mixes over the soundtrack (the music ducks under the voice).
//
//   node presentation/motion/source/voice.mjs             → voice/{master,portfolio,teaser,social}.flac + .srt captions
//   VOICE=am_fenrir node presentation/motion/source/voice.mjs   (any Kokoro voice; default am_michael)
//   node presentation/motion/source/voice.mjs --samples   → voice/samples/<voice>.wav, one line per candidate voice
//
// Needs Python with kokoro-onnx + soundfile (PYTHON=/path/to/python, default `python`), the Kokoro model files in
// KOKORO_DIR (see voice.py), and ffmpeg (FFMPEG or PATH).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as cuts from './cuts.mjs'
import { here, motionRoot } from './toolkit.mjs'

const VOICE = process.env.VOICE || 'am_michael'
const SAMPLE_VOICES = ['am_michael', 'am_fenrir', 'am_puck', 'bm_george', 'af_heart', 'af_bella']
const CUTS = ['master', 'portfolio', 'teaser', 'social']
const python = process.env.PYTHON || 'python'
const ffmpeg = process.env.FFMPEG || 'ffmpeg'
const out = path.join(motionRoot, 'voice')

function speak(lines, voice, dir) {
  const spec = path.join(dir, `${voice}.json`)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(spec, JSON.stringify({ voice, speed: 1.0, lines }))
  return JSON.parse(execFileSync(python, [path.join(here, 'voice.py'), spec, dir], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }))
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'careerhive-voice-'))
try {
  if (process.argv.includes('--samples')) {
    const dir = path.join(out, 'samples')
    fs.mkdirSync(dir, { recursive: true })
    for (const voice of SAMPLE_VOICES) {
      const sub = path.join(tmp, voice)
      speak([{ id: voice, text: 'CareerHive puts every step in one place. Upload a CV, and the coach finds your next step.' }], voice, sub)
      fs.copyFileSync(path.join(sub, `${voice}.wav`), path.join(dir, `${voice}.wav`))
      console.log(`voice/samples/${voice}.wav`)
    }
  } else {
    const lines = CUTS.flatMap((name) => cuts[name]().vo.map(([t, text], i) => ({ id: `${name}-${String(i).padStart(2, '0')}`, name, t, text })))
    const dur = speak(lines.map(({ id, text }) => ({ id, text })), VOICE, tmp)
    fs.mkdirSync(out, { recursive: true })
    let late = 0
    for (const name of CUTS) {
      const cut = cuts[name](), mine = lines.filter((l) => l.name === name)
      for (const [i, l] of mine.entries()) {
        const end = l.t + dur[l.id], next = mine[i + 1]?.t ?? cut.length - 0.8
        const clash = end > next - 0.1
        if (clash) late++
        console.log(`${name.padEnd(9)} ${l.t.toFixed(2).padStart(5)} → ${end.toFixed(2).padStart(5)} s  ${l.text}${clash ? `   ✗ runs ${(end - next + 0.1).toFixed(2)} s into the next line` : ''}`)
      }
      // one stem per cut: each line at its time; high-pass, gentle compression, speech at −16 LUFS, 48 kHz mono
      const inputs = mine.flatMap((l) => ['-i', path.join(tmp, `${l.id}.wav`)])
      const placed = mine.map((l, i) => `[${i}:a]aresample=48000,adelay=${Math.round(l.t * 1000)}:all=1[d${i}]`).join(';')
      const graph = `${placed};${mine.map((_, i) => `[d${i}]`).join('')}amix=inputs=${mine.length}:normalize=0,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-16:TP=-2:LRA=7,aresample=48000,apad=whole_dur=${cut.length}[v]`
      execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[v]', '-ac', '1', '-t', String(cut.length), path.join(out, `${name}.flac`)])
      // captions for upload (YouTube, LinkedIn): the same lines and times as the stem
      const stamp = (s) => new Date(Math.round(s * 1000)).toISOString().slice(11, 23).replace('.', ',')
      fs.writeFileSync(path.join(out, `${name}.srt`), mine.map((l, i) => `${i + 1}\n${stamp(l.t)} --> ${stamp(l.t + dur[l.id])}\n${l.text}\n`).join('\n'))
      console.log(`→ voice/${name}.flac + ${name}.srt (${VOICE})\n`)
    }
    if (late) { console.error(`${late} line(s) run into the next one: shorten them or move their start times in cuts.mjs`); process.exitCode = 1 }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
