import { AccountsPanel } from '../components/Accounts'
import { Icon, Page } from '../components/ui'
import { useDerived, useStore } from '../store/store'
import Command from './dashboard/Command'
import Figures from './dashboard/Figures'
import { ContinueLearning, FormationShelf } from './dashboard/Learning'
import { Recommended, TeamStrip } from './dashboard/Lists'
import { NextSteps, SkillSignal } from './dashboard/Progress'
import OrgPanel from './OrgPanel'

/**
 * The dashboard, ordered by what each role needs first:
 *   employee — command (promotion readiness) · their figures · continue learning + next steps · formations · skills + picks · team
 *   staff    — command (requests waiting) · catalog · organisation · team
 */
export default function Dashboard() {
  const { state } = useStore()
  const d = useDerived()
  const org = state.dashboard?.org

  return (
    <Page className="dash">
      <Command />
      {!d.isStaff && (
        <>
          <Figures />
          <div className="dash-grid">
            <ContinueLearning />
            <NextSteps />
          </div>
          <FormationShelf />
          <div className="dash-grid even">
            <SkillSignal />
            <Recommended />
          </div>
        </>
      )}
      {d.isStaff && <Recommended />}
      <TeamStrip />
      {state.user.isOwner && <AccountsPanel />}
      {d.isStaff && org && <OrgPanel org={org} role={state.user.role} />}
    </Page>
  )
}

/** A centred empty block, used by several pages: what's missing and what to do next. */
export function Empty({ icon = 'Sparkles', title, text, children }) {
  return (
    <div className="empty">
      <div className="lk"><Icon name={icon} size={24} /></div>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}
