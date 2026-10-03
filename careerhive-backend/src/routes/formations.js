// Formation catalog, enrollments (my-formations) and enrollment requests:
// pending → (HR review) on-hold → (manager confirm) approved + enrolled; either can reject.
// Managers have the final say: they can also confirm a request that is still pending (e.g. when there is no HR yet).
import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { requireRole } from '../auth.js'
import { config } from '../config.js'
import { one, q } from '../db.js'
import { day, fail, id, isStaff, STAFF, text } from '../http.js'
import { ENROLLMENT_SELECT, enrollmentOut, formationOut, fullName } from '../mappers.js'
import { notify, notifyRoles } from '../notify.js'

const router = Router()
const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé']

export async function skillsByFormation(ids) {
  const rows = await q('SELECT formation_id, skill_name FROM formation_skills WHERE formation_id IN (?) ORDER BY id', [[0, ...ids]])
  const map = new Map(ids.map((i) => [i, []]))
  rows.forEach((r) => map.get(r.formation_id)?.push(r.skill_name))
  return map
}

router.get('/formations', async (req, res) => {
  const rows = await q('SELECT * FROM formations ORDER BY created_at DESC, id DESC')
  const skills = await skillsByFormation(rows.map((f) => f.id))
  res.json({ formations: rows.map((f) => formationOut(f, skills.get(f.id))) })
})

router.post('/formations', requireRole(...STAFF), async (req, res) => {
  const title = text(req.body.title, { field: 'Title', max: 255, required: true })
  const level = LEVELS.includes(req.body.level) ? req.body.level : 'Intermédiaire'
  const skills = [...new Set((Array.isArray(req.body.skills) ? req.body.skills : []).map((s) => String(s).trim().slice(0, 150)).filter(Boolean))]
  const { insertId } = await q(`INSERT INTO formations (title, description, duration, instructor, level, category, available, icon_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, text(req.body.description, { field: 'Description', max: 10000 }),
    text(req.body.duration, { field: 'Duration', max: 50 }), text(req.body.instructor, { field: 'Instructor', max: 150 }), level,
    text(req.body.category, { field: 'Category', max: 100 }), req.body.available === false ? 0 : 1,
    text(req.body.iconUrl, { field: 'Icon', max: 500 }), req.user.id])
  if (skills.length) await q('INSERT INTO formation_skills (formation_id, skill_name) VALUES ?', [skills.map((s) => [insertId, s])])
  if (req.body.available !== false) {
    // employees hear about a new formation in the catalog (HR and managers run the catalog; they don't take formations)
    const instructor = text(req.body.instructor, { field: 'Instructor', max: 150 })
    const details = [level, text(req.body.duration, { field: 'Duration', max: 50 }), instructor && `by ${instructor}`].filter(Boolean).join(' · ')
    await notifyRoles(['student'], { type: 'formation', title: `New formation: ${title}`, body: details, link: `/formations?open=${insertId}` }, req.user.id)
  }
  res.status(201).json({ id: insertId, message: 'Formation created.' })
})

// Remove a formation from the catalog: its skills, enrollments, requests and course content go with it (ON DELETE CASCADE),
// and so do its uploaded files. Enrolled employees are told.
router.delete('/formations/:id', requireRole(...STAFF), async (req, res) => {
  const formation = await one('SELECT id, title FROM formations WHERE id = ?', [id(req.params.id, 'formation id')])
  if (!formation) fail(404, 'Formation not found.')
  const learners = await q('SELECT user_id FROM user_formation_progress WHERE formation_id = ?', [formation.id])
  await q('DELETE FROM formations WHERE id = ?', [formation.id])
  const dir = path.resolve(config.uploadDir, 'formations', String(formation.id))
  if (dir.startsWith(config.uploadDir + path.sep)) await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {})
  const ids = learners.map((l) => l.user_id).filter((u) => u !== req.user.id)
  if (ids.length) await notify(ids, { type: 'formation', title: 'Formation removed', body: `“${formation.title}” is no longer in the catalog.`, link: '/formations' })
  res.json({ deleted: true })
})

router.post('/formations/:id/assign', requireRole(...STAFF), async (req, res) => {
  const formation = await one('SELECT id, title FROM formations WHERE id = ?', [id(req.params.id, 'formation id')])
  if (!formation) fail(404, 'Formation not found.')
  const user = await one('SELECT id, role FROM users WHERE id = ?', [id(req.body.userId, 'user id')])
  if (!user) fail(404, 'User not found.')
  if (user.role !== 'student') fail(400, 'Formations are for employees; HR and managers manage them.')
  if (await one('SELECT id FROM user_formation_progress WHERE user_id = ? AND formation_id = ?', [user.id, formation.id])) {
    fail(409, 'This employee is already assigned to this formation.')
  }
  await q("INSERT INTO user_formation_progress (user_id, formation_id, status, progress, started_at, assigned_by) VALUES (?, ?, 'En cours', 0, UTC_DATE(), ?)",
    [user.id, formation.id, req.user.id])
  await notify(user.id, { type: 'formation', title: 'New formation assigned', body: formation.title, link: `/formations?open=${formation.id}` })
  res.status(201).json({ message: 'Formation assigned successfully.' })
})

router.get('/my-formations', async (req, res) => {
  const rows = await q(`${ENROLLMENT_SELECT} WHERE p.user_id = ? ORDER BY p.started_at DESC, p.id DESC`, [req.user.id])
  res.json({ formations: rows.map(enrollmentOut) })
})

router.put('/my-formations/:id/progress', async (req, res) => {
  const progress = Math.round(Number(req.body.progress))
  if (!(progress >= 0 && progress <= 100)) fail(400, 'Progress must be between 0 and 100.')
  const { affectedRows } = await q(`UPDATE user_formation_progress SET progress = ?, status = IF(? >= 100, 'Terminée', 'En cours'),
    completed_at = IF(? >= 100, COALESCE(completed_at, UTC_TIMESTAMP()), NULL) WHERE id = ? AND user_id = ?`,
  [progress, progress, progress, id(req.params.id), req.user.id])
  if (!affectedRows) fail(404, 'Enrollment not found.')
  res.json({ success: true, progress })
})

const requestOut = (r) => ({
  id: r.id, formationId: r.formation_id, formationTitle: r.title, userId: r.user_id, employeeName: fullName(r),
  employeeAvatar: r.profile_photo, motivation: r.motivation, status: r.status, requestedAt: day(r.requested_at),
})
const REQUEST_SELECT = `SELECT r.*, f.title, u.first_name, u.last_name, u.profile_photo
  FROM formation_requests r JOIN formations f ON f.id = r.formation_id JOIN users u ON u.id = r.user_id`

router.post('/formation-requests', async (req, res) => {
  if (isStaff(req.user)) fail(403, 'HR and managers manage formations; they don\'t join them.')
  const motivation = text(req.body.motivation, { field: 'Motivation', max: 5000 })
  if (!req.body.formationId || !motivation) fail(400, 'Formation and motivation are required.')
  const formation = await one('SELECT id, title, available FROM formations WHERE id = ?', [id(req.body.formationId, 'formation id')])
  if (!formation) fail(404, 'Formation not found.')
  if (!formation.available) fail(400, 'This formation is not open for enrollment.')
  if (await one('SELECT id FROM user_formation_progress WHERE user_id = ? AND formation_id = ?', [req.user.id, formation.id])) fail(409, 'You are already enrolled in this formation.')
  if (await one("SELECT id FROM formation_requests WHERE user_id = ? AND formation_id = ? AND status IN ('pending', 'on-hold')", [req.user.id, formation.id])) {
    fail(409, 'You already asked to join this formation.')
  }
  const { insertId } = await q('INSERT INTO formation_requests (formation_id, user_id, motivation) VALUES (?, ?, ?)', [formation.id, req.user.id, motivation])
  await notifyRoles(['hr', 'manager', 'admin'], { type: 'review', title: `${req.user.name} wants to join a formation`, body: formation.title, link: '/reviews' }, req.user.id)
  res.status(201).json({ id: insertId, message: 'Request submitted.' })
})

// Staff see every request; employees see their own.
router.get('/formation-requests', async (req, res) => {
  const rows = isStaff(req.user)
    ? await q(`${REQUEST_SELECT} ORDER BY r.requested_at DESC, r.id DESC`)
    : await q(`${REQUEST_SELECT} WHERE r.user_id = ? ORDER BY r.requested_at DESC, r.id DESC`, [req.user.id])
  res.json({ requests: rows.map(requestOut) })
})

async function loadRequest(req) {
  const r = await one(`${REQUEST_SELECT} WHERE r.id = ?`, [id(req.params.id)])
  if (!r) fail(404, 'Request not found.')
  if (r.user_id === req.user.id) fail(403, 'You cannot review your own request.')
  return r
}

router.put('/formation-requests/:id/hr-review', requireRole('hr', 'admin'), async (req, res) => {
  const r = await loadRequest(req)
  if (r.status !== 'pending') fail(409, 'This request is not waiting for HR review.')
  await q("UPDATE formation_requests SET status = 'on-hold', hr_reviewed_by = ?, hr_reviewed_at = UTC_TIMESTAMP() WHERE id = ?", [req.user.id, r.id])
  await notify(r.user_id, { type: 'formation', title: `HR approved “${r.title}”`, body: 'Waiting for your manager to confirm the enrollment.', link: '/formations?tab=requests' })
  await notifyRoles(['manager', 'admin'], { type: 'review', title: `${fullName(r)} wants to join a formation`, body: `${r.title} — approved by HR`, link: '/reviews' }, req.user.id)
  res.json({ success: true })
})

router.put('/formation-requests/:id/manager-confirm', requireRole('manager', 'admin'), async (req, res) => {
  const r = await loadRequest(req)
  if (!['pending', 'on-hold'].includes(r.status)) fail(409, 'This request has already been decided.')
  await q("UPDATE formation_requests SET status = 'approved', decided_by = ?, decided_at = UTC_TIMESTAMP() WHERE id = ?", [req.user.id, r.id])
  await q("INSERT IGNORE INTO user_formation_progress (user_id, formation_id, status, progress, started_at) VALUES (?, ?, 'En cours', 0, UTC_DATE())",
    [r.user_id, r.formation_id])
  await notify(r.user_id, { type: 'formation', title: `You're enrolled in “${r.title}”`, body: 'It is now in My formations.', link: `/formations?open=${r.formation_id}` })
  res.json({ success: true })
})

router.put('/formation-requests/:id/reject', requireRole(...STAFF), async (req, res) => {
  const r = await loadRequest(req)
  if (!['pending', 'on-hold'].includes(r.status)) fail(409, 'This request has already been decided.')
  await q("UPDATE formation_requests SET status = 'rejected', decided_by = ?, decided_at = UTC_TIMESTAMP() WHERE id = ?", [req.user.id, r.id])
  await notify(r.user_id, { type: 'rejected', title: `“${r.title}” request declined`, body: 'Talk to your manager about alternatives.', link: '/formations?tab=requests' })
  res.json({ success: true })
})

export default router
