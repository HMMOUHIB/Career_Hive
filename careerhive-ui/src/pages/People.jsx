import { motion } from 'framer-motion'
import { useState } from 'react'
import { AccountRow, useAccounts } from '../components/Accounts'
import { Icon, Page, rise, Reveal } from '../components/ui'

// People & roles — only the workspace owner sees this. New accounts (email, LinkedIn, GitHub, Google) start as employees;
// the owner decides who is a manager or HR, and can delete accounts. The backend enforces it (/api/people).
export default function People() {
  const { people, busy, changeRole, remove, count } = useAccounts()
  const [filter, setFilter] = useState('')
  const q = filter.trim().toLowerCase()
  const shown = (people ?? []).filter((p) => !q || [p.name, p.email, p.position, p.department].some((v) => v?.toLowerCase().includes(q)))

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div>
          <div className="eyebrow">Manage · People & roles</div>
          <Reveal text="People & roles" />
          <p>{count('student')} employees · {count('manager')} managers · {count('hr')} HR</p>
        </div>
      </motion.div>

      <motion.div variants={rise} className="note" style={{ marginBottom: 14 }}>
        <Icon name="ShieldCheck" size={16} />
        <div>New accounts — email, LinkedIn, GitHub or Google — start as <b>employees</b>. You choose who becomes a manager or HR; the change applies right away and the person is notified. Deleting an account also removes their requests, messages and enrollments.</div>
      </motion.div>

      <motion.div variants={rise} style={{ marginBottom: 14 }}>
        <input className="input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by name, email, position or department" />
      </motion.div>

      <motion.section variants={rise} className="card people-list">
        {!people && <div className="people-empty">Loading people…</div>}
        {people && !shown.length && <div className="people-empty">No one matches.</div>}
        {shown.map((p) => <AccountRow key={p.id} person={p} busy={busy} onRole={changeRole} onDelete={remove} idPrefix="people" />)}
      </motion.section>
    </Page>
  )
}
