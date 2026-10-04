import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './ui'

export default function Drawer({ open, onClose, cover, art, title, eyebrow, children, footer, wide }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  // Portal to <body> so the drawer always sits above the sidebar, rails and animated backgrounds.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="drawer-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className={`drawer ${wide ? 'wide' : ''}`} role="dialog" aria-label={title}
            initial={{ x: '110%', rotate: 2 }} animate={{ x: 0, rotate: 0 }} exit={{ x: '110%' }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            <div className="drawer-cover" style={{ background: cover ?? 'var(--hero)' }}>
              {art}
              <button className="round white" onClick={onClose} style={{ position: 'absolute', top: 18, right: 18 }} aria-label="Close"><Icon name="X" size={16} /></button>
              {eyebrow && <div className="eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}>{eyebrow}</div>}
              <h2 style={{ fontSize: 24, letterSpacing: '-0.02em', marginTop: 6 }}>{title}</h2>
            </div>
            <div className="drawer-body">{children}</div>
            {footer && <div className="drawer-foot">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
