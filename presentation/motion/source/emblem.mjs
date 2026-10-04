// The app's logo for the films: the 3D emblem (careerhive-ui/src/assets/hamzaoui.glb) rendered with exactly the app's
// material, lights and camera (careerhive-ui/src/three/HamzaouiMark.jsx), in two tones: Frost (the accent) and white
// (for coloured panels). Writes, per tone, a still and a 48-frame coin-turn sprite sheet (8 × 6) to motion/assets/.
//
//   node presentation/motion/source/emblem.mjs
//
// Model: "Rick and Morty" by Ian Dowson on Sketchfab, CC BY 4.0. The films carry this credit on their end card.
import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import path from 'node:path'
import { motionRoot, presRoot } from './toolkit.mjs'

const root = path.resolve(presRoot, '..') // careerhive-frontend/: the page imports three from careerhive-ui
const playwright = createRequire(path.resolve(root, 'careerhive-ui/package.json'))('playwright')
const out = path.join(motionRoot, 'assets')
const FRAME = 512, COLS = 8, ROWS = 6, STILL = 1024

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{ "imports": { "three": "/careerhive-ui/node_modules/three/build/three.module.js", "three/addons/": "/careerhive-ui/node_modules/three/examples/jsm/" } }</script>
</head><body style="margin:0;background:transparent"><script type="module">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// HamzaouiMark.jsx: FIT 4.4, camera z 10 fov 30, ambient 1.2, directional (3, 4, 6) × 2, flat (no tone mapping)
const FIT = 4.4, TINT = { frost: '#2f7bf6', white: '#ffffff' }
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })
renderer.toneMapping = THREE.NoToneMapping
renderer.setPixelRatio(1)
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
camera.position.set(0, 0, 10)
scene.add(new THREE.AmbientLight(0xffffff, 1.2))
const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(3, 4, 6); scene.add(sun)
const gltf = await new GLTFLoader().loadAsync('/careerhive-ui/src/assets/hamzaoui.glb')
const material = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 })
const model = gltf.scene
model.traverse((o) => { if (o.isMesh) o.material = material })
const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3())
model.position.copy(center).negate()
const fit = new THREE.Group(); fit.add(model); fit.scale.setScalar(FIT / Math.max(size.x, size.y)); scene.add(fit)
window.renderTone = (tone, frame, cols, rows, still) => {
  const c = TINT[tone]; material.color.set(c); material.emissive.set(c); material.emissiveIntensity = tone === 'white' ? 0.2 : 0.3
  renderer.setSize(still, still); fit.rotation.y = 0; renderer.render(scene, camera)
  const stillUrl = renderer.domElement.toDataURL('image/png')
  renderer.setSize(frame, frame)
  const sheet = document.createElement('canvas'); sheet.width = frame * cols; sheet.height = frame * rows
  const g = sheet.getContext('2d')
  for (let i = 0; i < cols * rows; i++) {
    fit.rotation.y = (i / (cols * rows)) * Math.PI * 2 // even angles: the film eases the turn itself
    renderer.render(scene, camera)
    g.drawImage(renderer.domElement, (i % cols) * frame, Math.floor(i / cols) * frame)
  }
  return { stillUrl, sheetUrl: sheet.toDataURL('image/png') }
}
window.ready = true
</script></body></html>`

const types = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html' }
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0])
  if (url === '/__emblem.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE) }
  const file = path.join(root, url)
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const browser = await playwright.chromium.launch({ channel: 'chrome' })
try {
  const tab = await browser.newPage()
  const errors = []
  tab.on('pageerror', (e) => errors.push(String(e)))
  await tab.goto(`http://127.0.0.1:${server.address().port}/__emblem.html`)
  await tab.waitForFunction(() => window.ready === true, null, { timeout: 60000 }).catch(() => { throw new Error(errors.join('\n') || 'emblem page did not load') })
  fs.mkdirSync(out, { recursive: true })
  for (const tone of ['frost', 'white']) {
    const { stillUrl, sheetUrl } = await tab.evaluate(([t, f, c, r, s]) => window.renderTone(t, f, c, r, s), [tone, FRAME, COLS, ROWS, STILL])
    fs.writeFileSync(path.join(out, `emblem-${tone}.png`), Buffer.from(stillUrl.split(',')[1], 'base64'))
    fs.writeFileSync(path.join(out, `emblem-${tone}-turn.png`), Buffer.from(sheetUrl.split(',')[1], 'base64'))
    console.log(`assets/emblem-${tone}.png · assets/emblem-${tone}-turn.png`)
  }
} finally {
  await browser.close()
  server.close()
}
