// The film's soundtrack, synthesised here (no third-party music or samples, so no licence to manage).
// Warm pad chords (C – Am – F – G at 100 BPM), a plucked arpeggio, soft kick, sub bass and a light shaker, plus sound
// design timed to the picture: riser, impacts, whooshes, UI clicks, a notification pop and ticks.
// writeWav(path, cues) → 48 kHz stereo 16-bit WAV.
import fs from 'node:fs'

const SR = 48000
const midi = (n) => 440 * 2 ** ((n - 69) / 12)
const CHORDS = [[48, 55, 59, 62, 64], [45, 52, 55, 59, 60], [41, 48, 52, 55, 57], [43, 50, 55, 57, 59]] // Cmaj9 · Am9 · Fmaj9 · G6/9
const BEAT = 0.6, CHORD_LEN = 4.8
const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1 })()

export function writeWav(file, { length, cues }) {
  const N = Math.ceil(length * SR)
  const L = new Float32Array(N), R = new Float32Array(N)
  const add = (i, l, r = l) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r } }
  const at = (t) => Math.round(t * SR)

  // pad: three detuned voices per note, slow swell per chord, gently panned
  const padEnd = length - 0.5
  for (let c = 0; c * CHORD_LEN < padEnd; c++) {
    const notes = CHORDS[c % 4], t0 = c * CHORD_LEN, dur = CHORD_LEN + 1.4
    for (const [k, n] of notes.entries()) {
      for (const [d, pan] of [[-5, -0.5], [0, 0], [5, 0.5]]) {
        const f = midi(n) * 2 ** (d / 1200), ph = (rand() + 1) * 3.14
        for (let i = 0; i < dur * SR; i++) {
          const t = i / SR, env = Math.min(1, t / 1.1) * Math.min(1, (dur - t) / 1.4)
          const v = (Math.sin(6.2832 * f * t + ph) + 0.12 * Math.sin(6.2832 * 3 * f * t + ph)) * env * 0.022 * (k === 0 ? 1.2 : 1)
          add(at(t0) + i, v * (1 - pan) * 0.9, v * (1 + pan) * 0.9)
        }
      }
    }
  }
  // sub bass from the solution beat to the end card
  for (let c = 0; c * CHORD_LEN < length; c++) {
    const t0 = c * CHORD_LEN
    if (t0 + CHORD_LEN < cues.bassFrom || t0 > cues.bassTo) continue
    const f = midi(CHORDS[c % 4][0] - 12)
    for (let i = 0; i < CHORD_LEN * SR; i++) {
      const t = i / SR, g = t0 + t
      if (g < cues.bassFrom || g > cues.bassTo) continue
      const kp = g - cues.kickFrom, duck = kp >= 0 && g < cues.kickTo ? 1 - 0.6 * Math.exp(-(kp % (BEAT * 2)) / 0.12) : 1
      add(at(t0) + i, Math.sin(6.2832 * f * t) * 0.075 * Math.min(1, t / 0.3) * Math.min(1, (CHORD_LEN - t) / 0.3) * duck)
    }
  }
  // plucked arpeggio, eighth notes, with a ping-pong echo
  const arpL = new Float32Array(N), arpR = new Float32Array(N)
  const pattern = [0, 2, 4, 3, 1, 3, 4, 2]
  for (let k = 0, t0 = cues.arpFrom; t0 < cues.arpTo; k++, t0 += BEAT / 2) {
    const chord = CHORDS[Math.floor(t0 / CHORD_LEN) % 4], f = midi(chord[pattern[k % 8]] + 12), pan = k % 2 ? 0.3 : -0.3
    for (let i = 0; i < 0.9 * SR; i++) {
      const t = i / SR, env = Math.min(1, t / 0.003) * Math.exp(-t / 0.2)
      const v = (Math.sin(6.2832 * f * t) + 0.3 * Math.sin(6.2832 * 2 * f * t) + 0.08 * Math.sin(6.2832 * 3 * f * t)) * env * 0.05
      const j = at(t0) + i
      if (j < N) { arpL[j] += v * (1 - pan); arpR[j] += v * (1 + pan) }
    }
  }
  const D = Math.round(BEAT * 0.75 * SR)
  for (let i = 0; i < N; i++) {
    const l = arpL[i] + (i >= D ? arpR[i - D] * 0.32 : 0), r = arpR[i] + (i >= D ? arpL[i - D] * 0.32 : 0)
    arpL[i] = l; arpR[i] = r; L[i] += l; R[i] += r
  }
  // soft kick on beats 1 and 3, and a light shaker on the off-beats while the features play
  for (let t0 = cues.kickFrom; t0 < cues.kickTo; t0 += BEAT * 2) {
    for (let i = 0, ph = 0; i < 0.35 * SR; i++) { const t = i / SR; ph += 6.2832 * (45 + 75 * Math.exp(-t / 0.035)) / SR; add(at(t0) + i, Math.sin(ph) * Math.exp(-t / 0.22) * 0.3) }
  }
  for (let t0 = cues.shakerFrom + BEAT / 2; t0 < cues.shakerTo; t0 += BEAT) {
    let hp = 0, prev = 0
    for (let i = 0; i < 0.06 * SR; i++) { const x = rand(); hp = 0.85 * (hp + x - prev); prev = x; const v = hp * Math.exp(-i / SR / 0.025) * 0.025; add(at(t0) + i, v * 0.8, v) }
  }
  // sound design
  const noiseSweep = (t0, dur, f0, f1, amp, up = true) => {
    let y = 0
    for (let i = 0; i < dur * SR; i++) {
      const t = i / SR, p = t / dur, fc = f0 * (f1 / f0) ** p, a = 1 - Math.exp(-6.2832 * fc / SR)
      y += a * (rand() - y)
      const env = up ? p ** 2 * Math.min(1, (dur - t) / 0.05) : Math.sin(Math.PI * p) ** 2
      add(at(t0) + i, y * env * amp, y * env * amp * 0.9)
    }
  }
  noiseSweep(0, cues.riserTo, 300, 7000, 0.16)
  for (const t0 of cues.impacts) {
    for (let i = 0; i < 1.8 * SR; i++) { const t = i / SR; add(at(t0) + i, Math.sin(6.2832 * 52 * t) * Math.exp(-t / 0.5) * 0.42) }
    noiseSweep(t0, 0.35, 4000, 300, 0.12, false)
  }
  for (const t0 of cues.whooshes) noiseSweep(t0 - 0.25, 0.7, 500, 5000, 0.11, false)
  for (const t0 of cues.softWhooshes) noiseSweep(t0 - 0.15, 0.4, 900, 4000, 0.045, false)
  for (const t0 of cues.clicks) {
    for (let i = 0; i < 0.04 * SR; i++) { const t = i / SR; add(at(t0) + i, (Math.sin(6.2832 * 1900 * t) * Math.exp(-t / 0.008) + 0.4 * Math.sin(6.2832 * 3600 * t) * Math.exp(-t / 0.003)) * 0.16) }
  }
  for (const t0 of cues.pops) {
    for (const [dt, f] of [[0, 880], [0.075, 1320]]) for (let i = 0; i < 0.12 * SR; i++) { const t = i / SR; add(at(t0 + dt) + i, Math.sin(6.2832 * f * t) * Math.exp(-t / 0.05) * 0.12) }
  }
  for (const t0 of cues.ticks) for (let i = 0; i < 0.08 * SR; i++) { const t = i / SR; add(at(t0) + i, Math.sin(6.2832 * 1250 * t) * Math.exp(-t / 0.025) * 0.09) }

  // master: fades, soft clip, normalise to -1 dBFS
  let peak = 0
  for (let i = 0; i < N; i++) {
    const t = i / SR, g = Math.min(1, t / 0.25) * Math.min(1, (length - t) / 2.2)
    L[i] = Math.tanh(L[i] * g * 1.4) / Math.tanh(1.4); R[i] = Math.tanh(R[i] * g * 1.4) / Math.tanh(1.4)
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
  }
  const norm = 0.89 / (peak || 1)
  const buf = Buffer.alloc(44 + N * 4)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
  for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4) }
  fs.writeFileSync(file, buf)
}
