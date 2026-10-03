// GET /api/dashboard — everything the home screen needs in one call.
// `me` is the caller's own learning, requests and team; `org` (staff only) is the organisation panel and review queue.
import { Router } from 'express'
import { q } from '../db.js'
import { day, isStaff } from '../http.js'
import { ENROLLMENT_SELECT, enrollmentOut, formationOut, fullName, promotionOut } from '../mappers.js'
import { skillsByFormation } from './formations.js'
import { teamsFor } from './teams.js'

const router = Router()
const WEEKS = 8

/** Count dates per week over the last 8 weeks, oldest first. */
function weekly(dates) {
  const buckets = Array(WEEKS).fill(0)
  const today = Date.parse(new Date().toISOString().slice(0, 10))
  for (const d of dates) {
    const ago = Math.floor((today - Date.parse(day(d))) / (7 * 864e5))
    if (ago >= 0 && ago < WEEKS) buckets[WEEKS - 1 - ago]++
  }
  return buckets
}
const since = `UTC_DATE() - INTERVAL ${WEEKS * 7} DAY`

/** Catalog entries with enrollment stats. */
async function formationStats(where = '1 = 1', params = []) {
  const rows = await q(`SELECT f.*, COUNT(p.id) AS enrolled, COALESCE(SUM(p.progress >= 100), 0) AS completed, COALESCE(ROUND(AVG(p.progress)), 0) AS avg_progress
    FROM formations f LEFT JOIN user_formation_progress p ON p.formation_id = f.id WHERE ${where} GROUP BY f.id`, params)
  const skills = await skillsByFormation(rows.map((f) => f.id))
  return rows.map((f) => ({ ...formationOut(f, skills.get(f.id)), enrolled: Number(f.enrolled), completed: Number(f.completed), avgProgress: Number(f.avg_progress) }))
}

/** Recent events (enrollments, requests, certificates, promotions), optionally for one user. */
async function activity(userId, limit) {
  const who = (col) => (userId ? `WHERE ${col} = ${Number(userId)}` : '')
  const rows = await q(`
    SELECT * FROM (
      SELECT 'enrollment' AS type, p.id, p.status, f.title AS subject, p.started_at AS at, p.user_id FROM user_formation_progress p JOIN formations f ON f.id = p.formation_id ${who('p.user_id')}
      UNION ALL SELECT 'formation_request', r.id, r.status, f.title, r.requested_at, r.user_id FROM formation_requests r JOIN formations f ON f.id = r.formation_id ${who('r.user_id')}
      UNION ALL SELECT 'certificate', c.id, NULL, c.certificate_name, c.created_at, c.user_id FROM certificates c ${who('c.user_id')}
      UNION ALL SELECT 'promotion', pr.id, pr.status, pr.requested_position, pr.submitted_date, pr.user_id FROM promotion_requests pr ${who('pr.user_id')}
    ) events ORDER BY at DESC, id DESC LIMIT ${Number(limit)}`)
  const people = await q('SELECT id, first_name, last_name FROM users WHERE id IN (?)', [[0, ...new Set(rows.map((r) => r.user_id))]])
  return rows.map((r) => ({
    type: r.type, id: `${r.type}-${r.id}`, status: r.status, subject: r.subject, at: day(r.at),
    person: fullName(people.find((p) => p.id === r.user_id) ?? {}),
  }))
}

async function mePanel(user) {
  const uid = user.id
  const [[counts], mine, requests, promotions, teams, trendRows] = await Promise.all([
    q('SELECT (SELECT COUNT(*) FROM skills WHERE user_id = ?) AS skills, (SELECT COUNT(*) FROM certificates WHERE user_id = ?) AS certificates', [uid, uid]),
    q(`${ENROLLMENT_SELECT} WHERE p.user_id = ? ORDER BY p.progress >= 100, p.started_at DESC`, [uid]),
    q(`SELECT r.id, f.title, r.status, r.requested_at FROM formation_requests r JOIN formations f ON f.id = r.formation_id
      WHERE r.user_id = ? ORDER BY r.requested_at DESC, r.id DESC LIMIT 3`, [uid]),
    q('SELECT * FROM promotion_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1', [uid]),
    teamsFor(user),
    q(`SELECT 'e' AS k, started_at AS d FROM user_formation_progress WHERE user_id = ? AND started_at >= ${since}
      UNION ALL SELECT 'c', created_at FROM certificates WHERE user_id = ? AND created_at >= ${since}
      UNION ALL SELECT 'r', requested_at FROM formation_requests WHERE user_id = ? AND requested_at >= ${since}
      UNION ALL SELECT 'r', submitted_date FROM promotion_requests WHERE user_id = ? AND submitted_date >= ${since}`, [uid, uid, uid, uid]),
  ])
  const completed = mine.filter((f) => f.progress >= 100).length

  // recommendations: open formations I'm not in, ranked by overlap with my skills, then popularity
  const mySkills = new Set((await q('SELECT LOWER(skill_name) AS s FROM skills WHERE user_id = ?', [uid])).map((r) => r.s))
  const enrolledIds = new Set(mine.map((f) => f.formation_id))
  const recommended = (await formationStats('f.available = 1'))
    .filter((f) => !enrolledIds.has(f.id))
    .map((f) => ({ f, score: f.skills.filter((s) => mySkills.has(s.toLowerCase())).length * 10 + f.enrolled }))
    .sort((a, b) => b.score - a.score || a.f.id - b.f.id).slice(0, 3).map((x) => x.f)

  const team = teams.find((t) => t.employees.some((e) => e.userId === uid))
  const meInTeam = team?.employees.find((e) => e.userId === uid)
  const p = promotions[0] ? promotionOut(promotions[0]) : null
  return {
    skills: counts.skills, certificates: counts.certificates,
    learning: { total: mine.length, active: mine.length - completed, completed, avgProgress: mine.length ? Math.round(mine.reduce((s, f) => s + f.progress, 0) / mine.length) : 0 },
    formations: mine.slice(0, 4).map(enrollmentOut),
    recommended,
    promotion: p && { id: p.id, status: p.status, currentPosition: p.currentPosition, requestedPosition: p.requestedPosition, submittedDate: p.submittedDate, hrApproval: p.hrApproval, managerApproval: p.managerApproval },
    formationRequests: requests.map((r) => ({ id: r.id, title: r.title, status: r.status, requestedAt: day(r.requested_at) })),
    team: team ? { id: team.id, name: team.name, members: team.employees.length, manager: team.manager, rating: meInTeam?.rating ?? null, feedback: meInTeam?.feedback ?? null } : null,
    trends: {
      enrollments: weekly(trendRows.filter((r) => r.k === 'e').map((r) => r.d)),
      certificates: weekly(trendRows.filter((r) => r.k === 'c').map((r) => r.d)),
      requests: weekly(trendRows.filter((r) => r.k === 'r').map((r) => r.d)),
    },
    activity: await activity(uid, 8),
  }
}

async function orgPanel(role) {
  const [[t], roles, promo, form, skills, depts, trendRows, popular] = await Promise.all([
    q(`SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM users WHERE role = 'student') AS employees,
      (SELECT COUNT(*) FROM teams) AS teams, (SELECT COUNT(*) FROM team_members) AS teamMembers,
      (SELECT COUNT(*) FROM certificates) AS certificates, (SELECT COUNT(*) FROM formations) AS catalog,
      (SELECT COUNT(*) FROM user_formation_progress) AS enrollments, (SELECT COUNT(*) FROM user_formation_progress WHERE progress >= 100) AS completedEnrollments,
      (SELECT COALESCE(ROUND(AVG(progress)), 0) FROM user_formation_progress) AS avgProgress,
      (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM team_members WHERE rating IS NOT NULL) AS avgRating`),
    q('SELECT role, COUNT(*) AS n FROM users GROUP BY role'),
    q('SELECT status, COUNT(*) AS n FROM promotion_requests GROUP BY status'),
    q('SELECT status, COUNT(*) AS n FROM formation_requests GROUP BY status'),
    q('SELECT MIN(skill_name) AS name, COUNT(*) AS count FROM skills GROUP BY LOWER(skill_name) ORDER BY count DESC, name LIMIT 6'),
    q(`SELECT COALESCE(NULLIF(department, ''), 'Unassigned') AS name, COUNT(*) AS count FROM users WHERE role = 'student'
      GROUP BY COALESCE(NULLIF(department, ''), 'Unassigned') ORDER BY count DESC, name LIMIT 6`),
    q(`SELECT 'e' AS k, started_at AS d FROM user_formation_progress WHERE started_at >= ${since}
      UNION ALL SELECT 'r', requested_at FROM formation_requests WHERE requested_at >= ${since}
      UNION ALL SELECT 'r', submitted_date FROM promotion_requests WHERE submitted_date >= ${since}
      UNION ALL SELECT 'c', created_at FROM certificates WHERE created_at >= ${since}
      UNION ALL SELECT 'u', created_at FROM users WHERE created_at >= ${since}`),
    formationStats(),
  ])
  const pipeline = (rows) => Object.fromEntries(['pending', 'on-hold', 'approved', 'rejected'].map((s) => [s, Number(rows.find((r) => r.status === s)?.n ?? 0)]))

  // the review queue: what waits on this role (HR reviews first, the manager decides)
  const statuses = { hr: ['pending'], manager: ['pending', 'on-hold'], admin: ['pending', 'on-hold'] }[role] // managers can decide either
  const [pq, fq] = await Promise.all([
    q(`SELECT r.id, r.status, r.current_position, r.requested_position, r.submitted_date, u.first_name, u.last_name, u.profile_photo
      FROM promotion_requests r JOIN users u ON u.id = r.user_id WHERE r.status IN (?) ORDER BY r.submitted_date, r.id`, [statuses]),
    q(`SELECT r.id, r.status, r.requested_at, f.title, u.first_name, u.last_name, u.profile_photo
      FROM formation_requests r JOIN formations f ON f.id = r.formation_id JOIN users u ON u.id = r.user_id WHERE r.status IN (?) ORDER BY r.requested_at, r.id`, [statuses]),
  ])
  const queue = {
    promotions: pq.map((r) => ({ id: r.id, status: r.status, employee: fullName(r), photo: r.profile_photo, currentPosition: r.current_position, requestedPosition: r.requested_position, date: day(r.submitted_date) })),
    formations: fq.map((r) => ({ id: r.id, status: r.status, employee: fullName(r), photo: r.profile_photo, formation: r.title, date: day(r.requested_at) })),
  }
  return {
    totals: { ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Number(v)])), promotionQueue: queue.promotions.length, formationQueue: queue.formations.length },
    usersByRole: Object.fromEntries(['student', 'manager', 'hr', 'admin'].map((r) => [r, Number(roles.find((x) => x.role === r)?.n ?? 0)])),
    popularFormations: popular.sort((a, b) => b.enrolled - a.enrolled || a.id - b.id).slice(0, 3),
    promotionPipeline: pipeline(promo),
    formationPipeline: pipeline(form),
    topSkills: skills.map((s) => ({ name: s.name, count: Number(s.count) })),
    departments: depts.map((d) => ({ name: d.name, count: Number(d.count) })),
    trends: Object.fromEntries([['enrollments', 'e'], ['requests', 'r'], ['certificates', 'c'], ['users', 'u']]
      .map(([key, k]) => [key, weekly(trendRows.filter((r) => r.k === k).map((r) => r.d))])),
    activity: await activity(null, 10),
    queue,
  }
}

router.get('/dashboard', async (req, res) => {
  const [me, org] = await Promise.all([mePanel(req.user), isStaff(req.user) ? orgPanel(req.user.role) : null])
  res.json({ role: req.user.role, me, org })
})

export default router
