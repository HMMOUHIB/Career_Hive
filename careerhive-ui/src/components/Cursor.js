/**
 * Custom mouse cursor: a small, flat portal gun whose canister takes the theme's accent (blue on Frost), so it
 * recolours with the theme. Over anything clickable it tilts up and glows a little more; a click recoils with a small
 * muzzle flash and a thin portal ring. Where the page shows a real cursor (the caret in text fields, not-allowed,
 * grabbing) it steps aside.
 *
 * Clickable targets are read from the element's computed cursor: while this runs, index.css maps the normal cursor to
 * `none` and the clickable one to a transparent `url(...)`, so hot targets are the ones whose cursor starts with url(.
 * Colours come from CSS (.cg-* rules use var(--accent)), so no JavaScript runs on a theme change.
 */
import { useEffect } from 'react'

// Drawn pointing along +x from the muzzle, then turned to aim up-left; the viewBox starts at the muzzle, so the tip is the pointer.
const GUN = `<div class="cg-body"><svg width="26" height="26" viewBox="4 4 44 44" overflow="visible">
  <g transform="translate(4 4) rotate(45)" class="cg-ink" stroke-width="1.6" stroke-linejoin="round">
    <path class="cg-grip" d="M30 5H39L41.5 17Q41.8 19 39.8 19.3L34.2 19.8Q32.2 20 31.9 18Z"/>
    <rect class="cg-shell" x="9" y="-6.5" width="37" height="13" rx="4"/>
    <rect class="cg-mount" x="18" y="-9.5" width="12" height="3.5" rx="1"/>
    <rect class="cg-tube" x="19" y="-19" width="10" height="10" rx="3.5"/>
    <rect class="cg-cap" x="18" y="-21" width="12" height="3" rx="1.2"/>
    <path class="cg-nozzle" d="M1 -3.2L9 -5V5L1 3.2Z"/>
    <ellipse class="cg-muzzle" cx="1" cy="0" rx="1.6" ry="3.4"/>
  </g>
  <circle class="cg-flash" cx="4" cy="4" r="5"/>
</svg></div>`

/** A thin portal ring where the shot lands (styles: .portal-pop). */
function portalAt(x, y) {
  if (document.querySelectorAll('.portal-pop').length > 6) return
  const pop = document.createElement('span')
  pop.className = 'portal-pop'
  pop.style.left = `${x}px`
  pop.style.top = `${y}px`
  pop.addEventListener('animationend', () => pop.remove())
  document.body.appendChild(pop)
}

export function useCursor() {
  useEffect(() => {
    if (!window.matchMedia?.('(pointer: fine)').matches) return // touch screens keep their own behaviour
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement
    const gun = document.createElement('div')
    gun.className = 'cg away'
    gun.setAttribute('aria-hidden', 'true')
    gun.innerHTML = GUN
    document.body.appendChild(gun)
    root.classList.add('cursor-on')

    let target = null
    let fireTimer
    const classify = (el) => {
      const cursor = el instanceof Element ? getComputedStyle(el).cursor : 'none'
      const hot = cursor.startsWith('url(')
      gun.classList.toggle('hot', hot)
      gun.classList.toggle('native', !hot && cursor !== 'none') // a real cursor is showing: step aside
    }
    const move = (e) => {
      if (e.pointerType === 'touch') return
      gun.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)` // the muzzle sits on the pointer
      gun.classList.remove('away')
      if (e.target !== target) classify((target = e.target))
    }
    const down = (e) => {
      if (e.pointerType === 'touch') return
      requestAnimationFrame(() => classify(e.target)) // e.g. dragging Rick switches to the grabbing hand
      if (e.button !== 0 || still) return
      gun.classList.remove('fire')
      void gun.offsetWidth // restart the recoil if clicks come fast
      gun.classList.add('fire')
      clearTimeout(fireTimer)
      fireTimer = setTimeout(() => gun.classList.remove('fire'), 280)
      portalAt(e.clientX, e.clientY)
    }
    const up = (e) => requestAnimationFrame(() => classify(e.target))
    const leave = () => gun.classList.add('away')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    root.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      root.removeEventListener('pointerleave', leave)
      clearTimeout(fireTimer)
      gun.remove()
      root.classList.remove('cursor-on')
    }
  }, [])
}
