import { useRef } from 'react'
import { DUR, EASE, gsap, reducedMotion, useGSAP } from '../motion/gsap'
import { fmtDate } from '../store/store'
import { Icon } from './ui'

/** Stages of the two-stage workflow used by both promotions and formation requests:
 *  submitted -> HR review ('pending') -> manager decision ('on-hold') -> approved | rejected */
export function stagesOf(req) {
  const s = req.status
  const hrRejected = req.hrApproval && req.hrApproval.approved === false
  const mgrRejected = req.managerApproval && req.managerApproval.approved === false
  const state = (k) => {
    if (k === 'submitted') return 'done'
    if (k === 'hr') return s === 'pending' ? 'current' : hrRejected || (s === 'rejected' && !req.hrApproval && !req.managerApproval) ? 'rejected' : 'done'
    if (k === 'manager') return s === 'on-hold' ? 'current' : s === 'approved' ? 'done' : mgrRejected ? 'rejected' : 'waiting'
    if (k === 'result') return s === 'approved' ? 'done' : s === 'rejected' ? 'rejected' : 'waiting'
  }
  return [
    { key: 'submitted', label: 'Submitted', sub: fmtDate(req.submittedDate ?? req.requestedAt), icon: 'Send', state: state('submitted') },
    { key: 'hr', label: 'HR review', sub: req.hrApproval?.approvedDate ? fmtDate(req.hrApproval.approvedDate) : s === 'pending' ? 'In review' : '', icon: 'ClipboardCheck', state: state('hr') },
    { key: 'manager', label: 'Manager decision', sub: req.managerApproval?.approvedDate ? fmtDate(req.managerApproval.approvedDate) : s === 'on-hold' ? 'In review' : '', icon: 'Crown', state: state('manager') },
    { key: 'result', label: s === 'rejected' ? 'Rejected' : 'Approved', sub: s === 'approved' ? (req.approvedPosition ?? '') : '', icon: s === 'rejected' ? 'CircleX' : 'Trophy', state: state('result') },
  ]
}

const STATE_LABEL = { done: 'done', current: 'in progress', rejected: 'rejected', waiting: 'not started' }

/**
 * The request's path as four stages on a line.
 * Motion — the line draws to the furthest stage reached while the stages step in (DUR.slow, EASE.out).
 * Trigger: mount and status changes. Reduced motion: static.
 */
export default function Tracker({ req, compact }) {
  const ref = useRef(null)
  const stages = stagesOf(req)
  const reached = stages.filter((s) => s.state === 'done' || s.state === 'current' || s.state === 'rejected').length
  const fill = (reached - 1) / (stages.length - 1)

  useGSAP(() => {
    if (reducedMotion()) return
    gsap.fromTo('.tracker-fill', { scaleX: 0 }, { scaleX: fill, duration: DUR.slow + 0.2, ease: EASE.out, delay: 0.1 })
    gsap.from('.tk', { autoAlpha: 0, y: 8, duration: DUR.base, ease: EASE.out, stagger: 0.09, delay: 0.1 })
  }, { scope: ref, dependencies: [req.status] })

  return (
    <div ref={ref} className={`tracker ${compact ? 'compact' : ''}`}>
      <div className="tracker-line" aria-hidden="true"><div className="tracker-fill" style={{ transform: `scaleX(${fill})` }} /></div>
      <ol className="tk-list" role="list" aria-label="Request progress">
        {stages.map((st) => (
          <li key={st.key} className={`tk ${st.state}`} aria-current={st.state === 'current' ? 'step' : undefined}>
            <div className="tk-dot" aria-hidden="true"><Icon name={st.state === 'done' ? 'Check' : st.state === 'rejected' ? 'X' : st.icon} size={compact ? 14 : 16} /></div>
            <b>{st.label}</b>
            <span className="sr-only">: {STATE_LABEL[st.state]}</span>
            {!compact && <small>{st.sub || (st.state === 'waiting' ? 'Waiting' : '')}</small>}
          </li>
        ))}
      </ol>
    </div>
  )
}
