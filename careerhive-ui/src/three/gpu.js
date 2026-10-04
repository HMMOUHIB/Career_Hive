/**
 * True when WebGL would run on the CPU (the browser's graphics acceleration is off, or there is no usable GPU driver).
 * A software renderer draws the mascots at about one frame a second and drags the whole page with it, so the 3D
 * stages stay empty there. Checked once, on a throwaway context.
 */
let software
export function softwareGL() {
  if (software !== undefined) return software
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    if (!gl) return (software = true)
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    software = /swiftshader|llvmpipe|softpipe|software|basic render|warp/i.test(name)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    software = true
  }
  return software
}
