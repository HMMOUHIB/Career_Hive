import { motion } from 'framer-motion'
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

export default function Tracker({ req, compact }) {
  const stages = stagesOf(req)
  const reached = stages.filter((s) => s.state === 'done' || s.state === 'current' || s.state === 'rejected').length
  return (
    <div className={`tracker ${compact ? 'compact' : ''}`}>
      <div className="tracker-line">
        <motion.div className="tracker-fill" initial={{ width: 0 }} animate={{ width: `${((reached - 1) / (stages.length - 1)) * 100}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
      </div>
      {stages.map((st, i) => (
        <motion.div key={st.key} className={`tk ${st.state}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }}>
          <div className="tk-dot"><Icon name={st.state === 'done' ? 'Check' : st.state === 'rejected' ? 'X' : st.icon} size={compact ? 14 : 16} /></div>
          <b>{st.label}</b>
          {!compact && <small>{st.sub || (st.state === 'waiting' ? 'Waiting' : '')}</small>}
        </motion.div>
      ))}
    </div>
  )
}
