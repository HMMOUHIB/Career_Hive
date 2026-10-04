import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { WebGLRenderer } from 'three'

/**
 * `gl` factory for a <Canvas>: the usual WebGLRenderer, except that unmounting leaves its context to garbage collection.
 * React Three Fiber disposes the scene and the renderer, then force-loses the context (WEBGL_lose_context); on
 * integrated GPUs that last call blocks the main thread for up to a second while the GPU drains, right when the next
 * page is trying to appear. Skipping it is safe: everything the context held has already been released.
 * Shader compile errors are checked only in development (see below).
 */
export const renderer = (options) => (defaults) => {
  const gl = new WebGLRenderer({ ...defaults, ...options })
  gl.forceContextLoss = () => {}
  // reading each shader's compile log makes the main thread wait for the GPU to finish compiling it (~¼ s per scene);
  // worth it while developing, not in production, where the compile then overlaps other work
  gl.debug.checkShaderErrors = import.meta.env.DEV
  return gl
}

/**
 * <Canvas resize={RESIZE}>: measure on resize only. By default R3F re-measures on every scroll and calls setSize, which
 * reallocates the drawing buffer even when nothing changed — frames dropped while scrolling. Pointer events use
 * offsetX/Y, so they don't need the scroll position.
 */
export const RESIZE = { scroll: false }

/**
 * Inside a frameloop="demand" Canvas: render about 72 times a second at most. A decorative scene gains nothing from a
 * 144 Hz screen's every frame, and each one costs main-thread time the page needs for scrolling and input.
 * (60 Hz screens still get every frame; 120/144 Hz ones get every other.)
 */
export function FrameCap() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    let id, last = 0
    const loop = (t) => {
      id = requestAnimationFrame(loop)
      if (t - last >= 13) { last = t; invalidate() }
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [invalidate])
  return null
}
