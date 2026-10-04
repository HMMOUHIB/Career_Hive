/**
 * The mascot stage: a model in front of a swirling vortex. `model` picks it (each loads only when used):
 *   'mouhib'   → Rick, src/assets/mouhib.glb (Mouhib.jsx): sign-in page, HR and manager dashboards
 *   'hamzaoui' → the Rick & Morty emblem, src/assets/hamzaoui.glb (Hamzaoui.jsx): employee dashboard
 *
 * Hivy — the original 3D clay bee built from primitives — is kept as the fallback if the model fails to load.
 * Its variants add a "professional" prop and pose:
 *   wave      → waves hello, briefcase in the other hand (sign-in page)
 *   laptop    → typing on a laptop (employee dashboard)
 *   clipboard → reviewing a clipboard, pen in hand (HR dashboard)
 *   manager   → tie + tablet with a growing bar chart, waves now and then (manager / admin dashboard)
 */
import { ContactShadows, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Component, lazy, Suspense, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { FrameCap, renderer, RESIZE } from './renderer'

const MODELS = { mouhib: lazy(() => import('./Mouhib')), hamzaoui: lazy(() => import('./Hamzaoui')) }

const C = {
  yellow: '#ffd43b', yellowDeep: '#f6b21b', brown: '#3b2616', white: '#fffaf2', black: '#1a1110',
  cheek: '#ff8f8f', wing: '#e8f6ff', skinShade: '#ffd978',
}

/** Soft "clay" look: high roughness, no metal, a hint of sheen. */
function Clay({ color, rough = 0.78, ...p }) {
  return <meshPhysicalMaterial color={color} roughness={rough} metalness={0} clearcoat={0.15} clearcoatRoughness={0.8} sheen={0.4} sheenColor="#ffffff" {...p} />
}

function Eye({ x, blink }) {
  return (
    <group position={[x, 1.02, 0.74]} ref={blink}>
      <mesh><sphereGeometry args={[0.25, 32, 32]} /><Clay color={C.white} rough={0.4} /></mesh>
      <mesh position={[x * 0.08, -0.02, 0.15]}><sphereGeometry args={[0.15, 32, 32]} /><Clay color={C.black} rough={0.25} /></mesh>
      <mesh position={[x * 0.08 - 0.05, 0.06, 0.28]}><sphereGeometry args={[0.045, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
    </group>
  )
}

function Arm({ side, armRef, hand = true, children }) {
  // pivot at the shoulder; the arm hangs along -y from the pivot
  return (
    <group ref={armRef} position={[side * 0.78, -0.28, 0.12]}>
      <mesh position={[0, -0.3, 0]}><capsuleGeometry args={[0.12, 0.42, 8, 16]} /><Clay color={C.brown} /></mesh>
      {hand && <mesh position={[0, -0.62, 0]}><sphereGeometry args={[0.15, 24, 24]} /><Clay color={C.yellow} /></mesh>}
      <group position={[0, -0.62, 0]}>{children}</group>
    </group>
  )
}

function Briefcase({ accent }) {
  return (
    <group position={[0, -0.36, 0.06]} rotation={[0, 0.25, 0.05]}>
      <RoundedBox args={[0.62, 0.46, 0.2]} radius={0.06} smoothness={4}><Clay color={accent} rough={0.6} /></RoundedBox>
      <mesh position={[0, 0.3, 0]}><torusGeometry args={[0.12, 0.035, 12, 24, Math.PI]} /><Clay color={C.brown} /></mesh>
      <mesh position={[0, 0.04, 0.105]}><boxGeometry args={[0.1, 0.07, 0.02]} /><Clay color="#f2d27a" rough={0.35} /></mesh>
    </group>
  )
}

function Laptop({ accent, screenRef }) {
  // Hivy sits behind the laptop: the screen faces Hivy, the viewer sees the lid and its glowing logo.
  return (
    <group position={[0, -1.02, 1.0]} rotation={[0.08, 0, 0]}>
      <RoundedBox args={[1.3, 0.07, 0.84]} radius={0.03} smoothness={3}><Clay color="#dfe3ea" rough={0.45} /></RoundedBox>
      <group position={[0, 0.03, 0.4]} rotation={[0.22, 0, 0]}>
        <RoundedBox args={[1.3, 0.82, 0.05]} radius={0.035} smoothness={3} position={[0, 0.41, 0]}><Clay color="#dfe3ea" rough={0.4} /></RoundedBox>
        <mesh position={[0, 0.41, -0.03]} rotation={[0, Math.PI, 0]} ref={screenRef}>
          <planeGeometry args={[1.16, 0.7]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0.43, 0.03]}><circleGeometry args={[0.15, 40]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} /></mesh>
        <mesh position={[0, 0.43, 0.032]}><ringGeometry args={[0.07, 0.1, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
      </group>
    </group>
  )
}

function Clipboard({ accent }) {
  return (
    <group position={[-0.34, -0.55, 1.02]} rotation={[-0.12, 0.22, 0.1]}>
      <RoundedBox args={[0.72, 0.95, 0.05]} radius={0.04} smoothness={3}><Clay color="#a86a3d" /></RoundedBox>
      <mesh position={[0, -0.04, 0.03]}><planeGeometry args={[0.6, 0.78]} /><Clay color={C.white} rough={0.9} /></mesh>
      <RoundedBox args={[0.3, 0.1, 0.07]} radius={0.02} smoothness={2} position={[0, 0.45, 0.03]}><Clay color="#c9ced8" rough={0.35} /></RoundedBox>
      {[0.2, 0.02, -0.16].map((y, i) => (
        <group key={i} position={[0, y, 0.035]}>
          <mesh position={[-0.2, 0, 0]}><planeGeometry args={[0.07, 0.07]} /><meshBasicMaterial color={i < 2 ? accent : '#c9ced8'} /></mesh>
          <mesh position={[0.06, 0, 0]}><planeGeometry args={[0.34, 0.035]} /><meshBasicMaterial color="#b7bcc6" /></mesh>
        </group>
      ))}
    </group>
  )
}

function Pen({ accent }) {
  return (
    <group position={[0, 0.05, 0.1]} rotation={[0.4, 0, -0.6]}>
      <mesh><cylinderGeometry args={[0.035, 0.035, 0.5, 12]} /><Clay color={accent} rough={0.4} /></mesh>
      <mesh position={[0, -0.28, 0]}><coneGeometry args={[0.035, 0.08, 12]} /><Clay color={C.brown} /></mesh>
    </group>
  )
}

function Tie({ accent }) {
  return (
    <group position={[0, -0.05, 0.93]} rotation={[-0.18, 0, 0]}>
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.16, 0.12, 0.07]} /><Clay color={accent} rough={0.55} /></mesh>
      <mesh position={[0, -0.3, -0.02]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.13, 0.5, 4]} /><Clay color={accent} rough={0.55} /></mesh>
    </group>
  )
}

function Tablet({ accent, barsRef }) {
  return (
    <group position={[0.42, -0.62, 1.04]} rotation={[-0.15, -0.28, -0.06]}>
      <RoundedBox args={[0.78, 0.56, 0.05]} radius={0.04} smoothness={3}><Clay color="#23262e" rough={0.4} /></RoundedBox>
      <mesh position={[0, 0, 0.03]}><planeGeometry args={[0.68, 0.46]} /><meshStandardMaterial color="#10131a" emissive={accent} emissiveIntensity={0.12} /></mesh>
      <group ref={barsRef} position={[-0.21, -0.18, 0.04]}>
        {[0.16, 0.24, 0.2, 0.34].map((h, i) => (
          <mesh key={i} position={[i * 0.14, h / 2, 0]} userData={{ h }}>
            <planeGeometry args={[0.09, h]} />
            <meshBasicMaterial color={i === 3 ? accent : '#8fd3ff'} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Hivy({ variant, accent }) {
  const root = useRef(), head = useRef(), wingL = useRef(), wingR = useRef()
  const armL = useRef(), armR = useRef(), eyeL = useRef(), eyeR = useRef()
  const screen = useRef(), bars = useRef()
  const nextBlink = useRef(1.5)

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime()
    // idle float + follow the cursor a little
    root.current.position.y = Math.sin(t * 1.6) * 0.07
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, pointer.x * 0.45, 0.06)
    head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -pointer.y * 0.18, 0.08)
    head.current.rotation.z = Math.sin(t * 0.9) * 0.04
    // wings buzz
    const flap = Math.sin(t * 28) * 0.35
    wingL.current.rotation.y = 0.5 + flap
    wingR.current.rotation.y = -0.5 - flap
    // blink every few seconds
    const b = t > nextBlink.current && t < nextBlink.current + 0.14 ? 0.1 : 1
    if (t > nextBlink.current + 0.14) nextBlink.current = t + 2.5 + Math.random() * 2.5
    eyeL.current.scale.y = eyeR.current.scale.y = b

    // poses
    const managerWave = variant === 'manager' && Math.sin(t * 0.5) > 0.7
    if (variant === 'wave') armR.current.rotation.set(0, 0, 2.5 + Math.sin(t * 7) * 0.35)
    else if (variant === 'laptop') armR.current.rotation.set(-1.15 + Math.sin(t * 16) * 0.08, 0, 0.3)
    else if (variant === 'clipboard') armR.current.rotation.set(-1.05 + Math.sin(t * 3) * 0.1, 0, 0.75 + Math.sin(t * 7) * 0.1) // writing
    else if (variant === 'manager') armR.current.rotation.set(-1.0, 0, 0.12) // holding the tablet

    if (variant === 'laptop') armL.current.rotation.set(-1.15 + Math.sin(t * 16 + 1.4) * 0.08, 0, -0.3)
    else if (variant === 'clipboard') armL.current.rotation.set(-0.95, 0, -0.15) // holding the clipboard
    else if (managerWave) armL.current.rotation.set(0, 0, -2.5 - Math.sin(t * 7) * 0.35)
    else armL.current.rotation.set(0, 0, -0.3 + Math.sin(t * 1.6) * 0.04)

    if (screen.current) screen.current.material.emissiveIntensity = 0.45 + Math.sin(t * 2) * 0.1
    if (bars.current) bars.current.children.forEach((m, i) => {
      const s = 0.75 + 0.25 * Math.abs(Math.sin(t * 1.2 + i * 0.7))
      m.scale.y = s; m.position.y = (m.userData.h * s) / 2
    })
  })

  return (
    <group ref={root}>
      {/* body with stripes */}
      <mesh position={[0, -0.55, 0]} scale={[1, 1.1, 0.95]}><sphereGeometry args={[0.9, 48, 48]} /><Clay color={C.yellow} /></mesh>
      {[-0.33, -0.78].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.95, 1]}>
          <torusGeometry args={[i ? 0.83 : 0.86, 0.1, 20, 64]} /><Clay color={C.brown} />
        </mesh>
      ))}
      <mesh position={[0, -1.55, -0.2]} rotation={[-0.5, 0, 0]}><coneGeometry args={[0.1, 0.25, 16]} /><Clay color={C.brown} /></mesh>
      {/* legs */}
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, -1.55, 0.18]}><capsuleGeometry args={[0.11, 0.18, 8, 16]} /><Clay color={C.brown} /></mesh>
      ))}
      {/* wings */}
      <mesh ref={wingL} position={[-0.42, 0.05, -0.62]}><sphereGeometry args={[0.5, 32, 16]} /><meshPhysicalMaterial color={C.wing} transparent opacity={0.55} roughness={0.15} clearcoat={1} scale={[1, 1, 0.1]} /></mesh>
      <mesh ref={wingR} position={[0.42, 0.05, -0.62]}><sphereGeometry args={[0.5, 32, 16]} /><meshPhysicalMaterial color={C.wing} transparent opacity={0.55} roughness={0.15} clearcoat={1} /></mesh>

      {/* head */}
      <group ref={head} position={[0, 0.1, 0]}>
        <mesh position={[0, 0.9, 0]}><sphereGeometry args={[0.95, 48, 48]} /><Clay color={C.yellow} /></mesh>
        <Eye x={-0.34} blink={eyeL} />
        <Eye x={0.34} blink={eyeR} />
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.72, 0.66]} scale={[1, 0.7, 0.4]}><sphereGeometry args={[0.14, 20, 20]} /><Clay color={C.cheek} rough={0.9} /></mesh>
        ))}
        <mesh position={[0, 0.66, 0.9]} rotation={[0.2, 0, Math.PI]}><torusGeometry args={[0.16, 0.035, 12, 24, Math.PI]} /><Clay color={C.brown} /></mesh>
        {/* antennae */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.3, 1.72, 0.05]} rotation={[0.15, 0, -s * 0.38]}>
            <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.035, 0.035, 0.56, 10]} /><Clay color={C.brown} /></mesh>
            <mesh position={[0, 0.6, 0]}><sphereGeometry args={[0.1, 20, 20]} /><Clay color={C.brown} /></mesh>
          </group>
        ))}
      </group>

      {/* arms + props */}
      <Arm side={-1} armRef={armL}>
        {variant === 'wave' && <Briefcase accent={accent} />}
      </Arm>
      <Arm side={1} armRef={armR}>
        {variant === 'clipboard' && <Pen accent={accent} />}
      </Arm>
      {variant === 'laptop' && <Laptop accent={accent} screenRef={screen} />}
      {variant === 'manager' && <Tie accent={accent} />}
      {variant === 'clipboard' && <Clipboard accent={accent} />}
      {variant === 'manager' && <Tablet accent={accent} barsRef={bars} />}
    </group>
  )
}

/* ---------- Vortex: original swirling energy disc + orbiting sparks behind the mascot ---------- */
const vortexVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`
const vortexFrag = `
  uniform float uTime; uniform vec3 uA; uniform vec3 uB; varying vec2 vUv;
  void main(){
    vec2 p = vUv * 2. - 1.;
    float r = length(p);
    if (r > 1.) discard;
    float a = atan(p.y, p.x);
    float arms = sin(a * 4. + r * 12. - uTime * 2.2) * .5 + .5;          // spiral arms
    float fine = sin(a * 11. - r * 26. + uTime * 3.1) * .5 + .5;          // fine detail
    float swirl = mix(arms, fine, .3);
    vec3 col = mix(uA, uB, swirl);
    col += vec3(1.) * pow(max(0., 1. - r), 5.) * .9;                       // bright core
    float rim = smoothstep(.78, .93, r) * smoothstep(1., .93, r);          // glowing edge
    col += mix(uA, vec3(1.), .4) * rim * 1.4;
    float alpha = (.25 + .6 * swirl) * smoothstep(1., .55, r) + rim * .9;
    gl_FragColor = vec4(col, clamp(alpha, 0., 1.) * .85);
  }`

function Vortex({ colors, stage }) {
  const root = useRef(), disc = useRef(), sparks = useRef(), ring = useRef()
  const [a, b] = colors
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uA: { value: new THREE.Color(a) }, uB: { value: new THREE.Color(b) } }), [a, b])
  const N = 520
  const seeds = useMemo(() => Array.from({ length: N }, () => ({ r: 1.2 + Math.random() * 1.5, a: Math.random() * Math.PI * 2, v: 0.25 + Math.random() * 0.6, z: (Math.random() - 0.5) * 0.4 })), [])
  const positions = useMemo(() => new Float32Array(N * 3), [])
  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    // hidden until the mascot has fully arrived, then it swirls open behind him
    const since = stage.current.arrivedAt === null ? -1 : t - stage.current.arrivedAt
    const open = since < 0 ? 0 : Math.min(1, since / 0.7)
    root.current.visible = open > 0
    root.current.scale.setScalar(1 + 2.2 * (open - 1) ** 3 + 1.2 * (open - 1) ** 2) // ease out with a little overshoot
    root.current.rotation.z = (1 - open) * 2
    uniforms.uTime.value = t
    const pulse = 1 + Math.sin(t * 1.8) * 0.03
    disc.current.scale.setScalar(pulse)
    disc.current.rotation.z = -t * 0.25
    ring.current.scale.setScalar(1 + Math.sin(t * 1.8 + 0.6) * 0.04)
    seeds.forEach((s, i) => {
      s.a += s.v * dt * (2.2 / s.r)        // inner sparks orbit faster
      s.r -= dt * 0.12 * s.v                // and slowly spiral inward
      if (s.r < 0.35) { s.r = 2.4 + Math.random() * 0.4; s.a = Math.random() * Math.PI * 2 }
      positions[i * 3] = Math.cos(s.a) * s.r
      positions[i * 3 + 1] = Math.sin(s.a) * s.r * 0.95
      positions[i * 3 + 2] = s.z
    })
    sparks.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <group ref={root} position={[0, 0.25, -1.9]} visible={false}>
      <mesh ref={disc}>
        <circleGeometry args={[2.25, 96]} />
        <shaderMaterial vertexShader={vortexVert} fragmentShader={vortexFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[2.28, 0.03, 12, 160]} />
        <meshBasicMaterial color={a} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <points ref={sparks}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
        <pointsMaterial color={b} size={0.05} sizeAttenuation transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  )
}

/** If the model fails to load, fall back to Hivy instead of breaking the page. */
class ModelBoundary extends Component {
  constructor(p) { super(p); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e) { this.props.onFail(); console.warn('Mascot model failed to load, showing Hivy instead:', e?.message) }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

const GL = renderer({ antialias: true, alpha: true, powerPreference: 'low-power' })

/**
 * `active` pauses rendering while the stage is off screen (the parent watches visibility);
 * `still` (reduced motion) renders on demand only, so nothing idles in a loop.
 */
export default function Mascot({ model = 'mouhib', variant = 'wave', accent = '#e8453c', shadow = true, distance = 7.2, vortex, active = true, still = false }) {
  const Model = MODELS[model]
  const stage = useRef({ arrivedAt: null }) // clock time the mascot is fully in view; the vortex waits for it
  return (
    <Canvas flat dpr={[1, 1.8]} frameloop={still || active ? 'demand' : 'never'} camera={{ position: [0, 0.2, distance], fov: 36 }} gl={GL} resize={RESIZE}>
      {active && !still && <FrameCap />}
      <hemisphereLight args={['#fff8ee', '#d9b38c', 1.05]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={1.7} color="#fff6ea" />
      <directionalLight position={[-4, 2, 2]} intensity={0.55} color="#ffd9e8" />
      <directionalLight position={[0, 3, -5]} intensity={0.8} color="#ffffff" />
      {vortex && <Vortex colors={vortex} stage={stage} />}
      <ModelBoundary fallback={<Hivy variant={variant} accent={accent} />} onFail={() => { stage.current.arrivedAt = -Infinity }}>
        <Suspense fallback={null}><Model stage={stage} /></Suspense>
      </ModelBoundary>
      {shadow && <ContactShadows position={[0, -1.78, 0]} opacity={0.35} scale={6} blur={2.6} far={3} />}
    </Canvas>
  )
}
