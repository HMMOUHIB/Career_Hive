import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Presence from '../motion/Presence'
import { Icon } from './ui'

/**
 * A side panel over the page (a dialog): slides in from the right, Escape or the scrim closes it, focus moves into it
 * and goes back to whatever opened it. Portalled to <body> so it sits above the navigation.
 */
export default function Drawer({ open, onClose, cover, art, title, eyebrow, children, footer, wide }) {
  const panel = useRef(null)
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    requestAnimationFrame(() => panel.current?.querySelector('.drawer-close')?.focus({ preventScroll: true }))
    return () => { window.removeEventListener('keydown', k); opener?.focus?.({ preventScroll: true }) }
  }, [open, onClose])

  return createPortal(
    <>
      <Presence show={open} variant="fade" duration={0.3}>
        <div className="scrim drawer-back" onClick={onClose} aria-hidden="true" />
      </Presence>
      <Presence show={open} variant="drawer" duration={0.55}>
        <aside ref={panel} className={`drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
          <div className="drawer-cover" style={{ background: cover ?? 'var(--signal)' }}>
            {art}
            <button type="button" className="round white drawer-close" onClick={onClose} aria-label="Close"><Icon name="X" size={16} /></button>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          <div className="drawer-body">{children}</div>
          {footer && <div className="drawer-foot">{footer}</div>}
        </aside>
      </Presence>
    </>,
    document.body,
  )
}
