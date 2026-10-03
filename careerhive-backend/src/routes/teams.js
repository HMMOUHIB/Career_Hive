import { Router } from 'express'
import { requireRole } from '../auth.js'
import { one, q } from '../db.js'
import { fail, id, isStaff, STAFF, text } from '../http.js'
import { fullName, presence } from '../mappers.js'
import { notify } from '../notify.js'

const router = Router()

/**
 * Teams visible to `viewer`: staff see every team; employees see the teams they belong to or manage.
 * Members linked to an account show that account's live name, photo, presence, skills and completed formations.
 * Ratings and feedback are private: only staff and the member themself see them.
 */
export async function teamsFor(viewer, onlyTeamId) {
  const teams = isStaff(viewer)
    ? await q(`SELECT * FROM teams ${onlyTeamId ? 'WHERE id = ?' : ''} ORDER BY id`, onlyTeamId ? [onlyTeamId] : [])
    : await q(`SELECT DISTINCT t.* FROM teams t LEFT JOIN team_members m ON m.team_id = t.id
        WHERE m.user_id = ? OR t.manager_user_id = ? ORDER BY t.id`, [viewer.id, viewer.id])
  if (!teams.length) return []
  const members = await q(`SELECT m.*, u.first_name, u.last_name, u.profile_photo, u.position, u.last_seen_at,
      (SELECT COUNT(*) FROM user_formation_progress p WHERE p.user_id = m.user_id AND p.progress >= 100) AS done
    FROM team_members m LEFT JOIN users u ON u.id = m.user_id WHERE m.team_id IN (?) ORDER BY m.id`, [teams.map((t) => t.id)])
  const memberSkills = await q('SELECT team_member_id, skill_name FROM team_member_skills WHERE team_member_id IN (?) ORDER BY id', [[0, ...members.map((m) => m.id)]])
  const userIds = [0, ...new Set(members.map((m) => m.user_id).filter(Boolean))]
  const userSkills = await q('SELECT user_id, skill_name FROM skills WHERE user_id IN (?) ORDER BY id', [userIds])
  const managers = await q('SELECT id, first_name, last_name, profile_photo, position FROM users WHERE id IN (?)', [[0, ...teams.map((t) => t.manager_user_id).filter(Boolean)]])

  return teams.map((t) => {
    const mgr = managers.find((u) => u.id === t.manager_user_id)
    return {
      id: t.id, name: t.name,
      manager: { name: t.manager_name || (mgr ? fullName(mgr) : null), role: t.manager_role || mgr?.position || 'Manager', avatar: t.manager_avatar || mgr?.profile_photo || null },
      employees: members.filter((m) => m.team_id === t.id).map((m) => {
        const own = userSkills.filter((s) => s.user_id === m.user_id).map((s) => s.skill_name)
        const listed = memberSkills.filter((s) => s.team_member_id === m.id).map((s) => s.skill_name)
        const canSee = isStaff(viewer) || m.user_id === viewer.id
        return {
          id: m.id, userId: m.user_id, name: m.user_id ? fullName(m) : m.member_name,
          avatar: m.profile_photo || m.member_avatar || null, status: m.user_id ? presence(m.last_seen_at) : 'off', tag: m.tag ?? undefined,
          role: m.member_role || m.position || null, rating: canSee ? m.rating : null, feedback: canSee ? m.feedback : null,
          completedTrainings: m.user_id ? m.done : m.completed_trainings, skills: m.user_id && own.length ? own : listed,
        }
      }),
    }
  })
}

router.get('/teams', async (req, res) => {
  res.json({ teams: await teamsFor(req.user) })
})

router.post('/teams', requireRole(...STAFF), async (req, res) => {
  const name = text(req.body.name, { field: 'Team name', max: 255, required: true })
  let managerName = text(req.body.managerName, { field: 'Manager name', max: 150 })
  const managerRole = text(req.body.managerRole, { field: 'Manager role', max: 100 }) ?? 'Manager'
  // link the manager to an account when the name matches a staff member (or default to the creator)
  let managerId = null
  if (!managerName) { managerName = req.user.name; managerId = req.user.id } else {
    const match = await one(`SELECT id FROM users WHERE role IN ('manager', 'hr', 'admin') AND CONCAT(first_name, ' ', last_name) = ? LIMIT 1`, [managerName])
    managerId = match?.id ?? null
  }
  const { insertId } = await q('INSERT INTO teams (name, manager_user_id, manager_name, manager_role, manager_avatar, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, managerId, managerName, managerRole, req.body.managerAvatar || null, req.user.id])
  const [team] = await teamsFor(req.user, insertId)
  res.status(201).json(team)
})

router.post('/teams/:id/members', requireRole(...STAFF), async (req, res) => {
  const teamId = id(req.params.id, 'team id')
  const team = await one('SELECT id, name FROM teams WHERE id = ?', [teamId])
  if (!team) fail(404, 'Team not found.')
  let account = null
  if (req.body.userId) {
    account = await one('SELECT id, first_name, last_name, position FROM users WHERE id = ?', [id(req.body.userId, 'user id')])
    if (!account) fail(404, 'User not found.')
    if (await one('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, account.id])) fail(409, 'This person is already in the team.')
  }
  const name = text(req.body.name, { field: 'Name', max: 150 }) ?? (account ? fullName(account) : fail(400, 'Choose an employee or enter a name.'))
  const rating = req.body.rating == null || req.body.rating === '' ? null : Number(req.body.rating)
  if (rating != null && !(rating >= 0 && rating <= 5)) fail(400, 'Rating must be between 0 and 5.')
  const skills = [...new Set((Array.isArray(req.body.skills) ? req.body.skills : []).map((s) => String(s).trim().slice(0, 150)).filter(Boolean))].slice(0, 30)

  const { insertId } = await q(`INSERT INTO team_members (team_id, user_id, member_name, member_avatar, member_role, rating, feedback, completed_trainings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [teamId, account?.id ?? null, name, req.body.avatar || null,
    text(req.body.role, { field: 'Role', max: 150 }) ?? account?.position ?? null, rating,
    text(req.body.feedback, { field: 'Feedback', max: 5000 }), Math.max(0, Math.floor(Number(req.body.completedTrainings) || 0))])
  if (skills.length) await q('INSERT INTO team_member_skills (team_member_id, skill_name) VALUES ?', [skills.map((s) => [insertId, s])])
  if (account) await notify(account.id, { type: 'info', title: `You joined ${team.name}`, body: `${req.user.name} added you to the team.`, link: '/team' })

  const [full] = await teamsFor(req.user, teamId)
  res.status(201).json(full.employees.find((m) => m.id === insertId))
})

router.put('/teams/members/:id/feedback', requireRole(...STAFF), async (req, res) => {
  const memberId = id(req.params.id, 'member id')
  const member = await one('SELECT m.id, m.user_id, t.name AS team FROM team_members m JOIN teams t ON t.id = m.team_id WHERE m.id = ?', [memberId])
  if (!member) fail(404, 'Team member not found.')
  const rating = req.body.rating == null ? null : Number(req.body.rating)
  if (rating != null && !(rating >= 0 && rating <= 5)) fail(400, 'Rating must be between 0 and 5.')
  const feedback = text(req.body.feedback, { field: 'Feedback', max: 5000 })
  await q('UPDATE team_members SET rating = COALESCE(?, rating), feedback = ? WHERE id = ?', [rating, feedback, memberId])
  if (member.user_id) {
    if (rating != null) await q('UPDATE users SET performance_rating = ? WHERE id = ?', [rating, member.user_id])
    await notify(member.user_id, { type: 'info', title: 'New feedback on your work', body: feedback ?? `Rated ${rating}/5 in ${member.team}.`, link: '/' })
  }
  const saved = await one('SELECT rating, feedback FROM team_members WHERE id = ?', [memberId])
  res.json({ id: memberId, rating: saved.rating, feedback: saved.feedback })
})

export default router
