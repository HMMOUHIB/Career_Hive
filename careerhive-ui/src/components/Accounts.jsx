// Registered accounts, as the workspace owner manages them: choose who is an employee, a manager or HR, or delete an
// account. Used by the dashboard's Accounts panel and the People & roles page. The backend allows this for the owner only.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { timeAgo, toMs } from '../store/notifications'
import { colorFor, useStore } from '../store/store'
import { Avatar, Icon, Tabs } from './ui'

const ROLES = [{ value: 'student', label: 'Employee' }, { value: 'manager', label: 'Manager' }, { value: 'hr', label: 'HR' }]
const ROLE_NAME = { student: 'an employee', manager: 'a manager', hr: 'HR', admin: 'an admin' }
const SIGN_IN = { email: 'Email', google: 'Google', linkedin: 'LinkedIn', github: 'GitHub' }

/** All accounts (newest first) and the owner's actions on them. */
export function useAccounts() {
  const { actions } = useStore()
  const [people, setPeople] = useState(null)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    api.people().then(setPeople).catch((e) => actions.toast(e.message, 'bad'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const changeRole = async (person, role) => {
    if (role === person.role || busy) return
    const before = people
    setBusy(person.id)
    setPeople(people.map((p) => (p.id === person.id ? { ...p, role } : p)))
    try {
      await api.setRole(person.id, role)
      actions.toast(`${person.name} is now ${ROLE_NAME[role]}`)
    } catch (e) {
      setPeople(before)
      actions.toast(e.message, 'bad')
    } finally { setBusy(null) }
  }

  const remove = async (person) => {
    setBusy(person.id)
    try {
      await api.deletePerson(person.id)
      setPeople((list) => list.filter((p) => p.id !== person.id))
      actions.toast(`${person.name}’s account was deleted`)
      actions.refresh('dashboard', 'teams', 'employees')
    } catch (e) {
      actions.toast(e.message, 'bad')
    } finally { setBusy(null) }
  }

  const count = (role) => (people ?? []).filter((p) => p.role === role).length
  return { people, busy, changeRole, remove, count }
}

/** One account: who, how they signed up, a role switch, and delete (asks to confirm on the row). */
export function AccountRow({ person: p, busy, onRole, onDelete, compact, idPrefix = 'acct' }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <div className={`person-row${compact ? ' compact' : ''}`}>
      <Avatar name={p.name} src={p.avatar} color={colorFor(p.name)} size={42} />
      <div style={{ minWidth: 0 }}>
        <div className="t">{p.name}{p.isOwner && <span className="chip accent">Owner</span>}</div>
        <div className="s">{p.email}</div>
      </div>
      {!compact && <div className="person-meta">{p.position || 'No position yet'}{p.department ? ` · ${p.department}` : ''}</div>}
      <div className="person-meta" title={p.confirmed ? undefined : 'Has not opened the confirmation email yet'}>
        {SIGN_IN[p.signIn] ?? p.signIn} · joined {timeAgo(toMs(p.joinedAt))}{!p.confirmed && ' · not confirmed'}
      </div>
      {p.isOwner ? (
        <div className="person-owner"><Icon name="Crown" size={14} />Manager · you</div>
      ) : confirm ? (
        <div className="person-confirm">
          <span>Delete {p.name.split(' ')[0]}’s account?</span>
          <button className="res-del" disabled={!!busy} onClick={() => onDelete(p)}>Delete</button>
          <button className="res-tool" onClick={() => setConfirm(false)} aria-label="Cancel"><Icon name="X" size={14} draw={false} /></button>
        </div>
      ) : (
        <div className="person-actions">
          <Tabs label={`Role for ${p.name}`} value={p.role} onChange={(role) => onRole(p, role)} items={ROLES} />
          <button className="res-tool" onClick={() => setConfirm(true)} aria-label={`Delete ${p.name}`} title="Delete account"><Icon name="Trash2" size={15} draw={false} /></button>
        </div>
      )}
    </div>
  )
}

/** Dashboard panel: the newest sign-ups, ready to be given a role. */
export function AccountsPanel({ limit = 6 }) {
  const { people, busy, changeRole, remove, count } = useAccounts()
  const shown = (people ?? []).slice(0, limit)
  return (
    <section data-reveal className="card accounts-panel" aria-labelledby="accounts-title">
      <div className="h-row">
        <div>
          <h2 id="accounts-title" className="t-h3">Accounts</h2>
          <p className="accounts-sub">
            {people ? `${count('student')} employees · ${count('manager')} managers · ${count('hr')} HR` : 'Loading…'} — new sign-ups start as employees; choose who is HR or a manager.
          </p>
        </div>
        <Link to="/people" className="more">All accounts <Icon name="ChevronRight" size={14} /></Link>
      </div>
      {shown.map((p) => <AccountRow key={p.id} person={p} busy={busy} onRole={changeRole} onDelete={remove} compact idPrefix="dash" />)}
      {people && people.length > limit && <Link to="/people" className="nlink" style={{ marginTop: 6 }}>See the other {people.length - limit} accounts <Icon name="ArrowRight" size={14} /></Link>}
    </section>
  )
}
