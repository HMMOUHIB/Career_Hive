// Promotion requests: pending → (HR review) on-hold → (manager final approve) approved; either reviewer can reject.
// Managers have the final say: they can also decide a request that is still pending (e.g. when there is no HR yet).
import { Router } from 'express'
import { requireRole } from '../auth.js'
import { one, q, tx } from '../db.js'
import { fail, id, isStaff, STAFF, text } from '../http.js'
import { promotionOut } from '../mappers.js'
import { notify, notifyRoles } from '../notify.js'

const router = Router()

async function withDetails(rows) {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const [skills, certs] = await Promise.all([
    q('SELECT promotion_request_id, skill_name FROM promotion_request_skills WHERE promotion_request_id IN (?) ORDER BY id', [ids]),
    q('SELECT promotion_request_id, certificate_name FROM promotion_request_certificates WHERE promotion_request_id IN (?) ORDER BY id', [ids]),
  ])
  return rows.map((r) => promotionOut(r,
    skills.filter((s) => s.promotion_request_id === r.id).map((s) => s.skill_name),
    certs.filter((c) => c.promotion_request_id === r.id).map((c) => c.certificate_name)))
}

/** Load a request for review, refusing your own. */
async function forReview(req) {
  const p = await one('SELECT r.*, u.first_name, u.last_name FROM promotion_requests r JOIN users u ON u.id = r.user_id WHERE r.id = ?', [id(req.params.id)])
  if (!p) fail(404, 'Promotion request not found.')
  if (p.user_id === req.user.id) fail(403, 'You cannot review your own request.')
  return { ...p, employee: `${p.first_name} ${p.last_name}`.trim() }
}

// Staff see every request; everyone else only their own (salaries included).
router.get('/promotion-requests', async (req, res) => {
  const rows = isStaff(req.user)
    ? await q('SELECT * FROM promotion_requests ORDER BY id DESC')
    : await q('SELECT * FROM promotion_requests WHERE user_id = ? ORDER BY id DESC', [req.user.id])
  res.json({ requests: await withDetails(rows) })
})

router.post('/promotion-requests', async (req, res) => {
  const requested = text(req.body.requestedPosition, { field: 'Requested position', max: 150 })
  const justification = text(req.body.justification, { field: 'Justification', max: 10000 })
  if (!requested || !justification) fail(400, 'Requested position and justification are required.')
  if (await one("SELECT id FROM promotion_requests WHERE user_id = ? AND status IN ('pending', 'on-hold')", [req.user.id])) {
    fail(409, 'You already have a promotion request in review.')
  }
  const me = await one('SELECT position, department FROM users WHERE id = ?', [req.user.id])
  const money = (v) => Math.max(0, Math.min(99_999_999, Number(v) || 0))
  const skills = [...new Set((Array.isArray(req.body.skills) ? req.body.skills : []).map((s) => String(s).trim().slice(0, 150)).filter(Boolean))]

  const requestId = await tx(async (tq) => {
    const { insertId } = await tq(`INSERT INTO promotion_requests (user_id, current_position, requested_position, department, current_salary,
      requested_salary, justification, achievements, timeline, status, submitted_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', UTC_DATE())`, [
      req.user.id, text(req.body.currentPosition, { field: 'Current position', max: 150 }) ?? me.position ?? '', requested,
      text(req.body.department, { field: 'Department', max: 100 }) ?? me.department, money(req.body.currentSalary), money(req.body.requestedSalary),
      justification, text(req.body.achievements, { field: 'Achievements', max: 10000 }), text(req.body.timeline, { field: 'Timeline', max: 150 }),
    ])
    if (skills.length) await tq('INSERT INTO promotion_request_skills (promotion_request_id, skill_name) VALUES ?', [skills.map((s) => [insertId, s])])
    // keep a snapshot of the certificates held at submission time
    await tq('INSERT INTO promotion_request_certificates (promotion_request_id, certificate_name) SELECT ?, certificate_name FROM certificates WHERE user_id = ?', [insertId, req.user.id])
    return insertId
  })
  await notifyRoles(['hr', 'manager', 'admin'], { type: 'review', title: `${req.user.name} asks for a promotion`, body: `${me.position || 'Current role'} → ${requested}`, link: '/reviews' }, req.user.id)
  res.status(201).json({ id: requestId, message: 'Promotion request submitted.' })
})

router.put('/promotion-requests/:id/hr-review', requireRole('hr', 'admin'), async (req, res) => {
  const p = await forReview(req)
  if (p.status !== 'pending') fail(409, 'This request is not waiting for HR review.')
  const comments = text(req.body.comments, { field: 'Comments', max: 5000 })
  await q(`UPDATE promotion_requests SET status = 'on-hold', hr_approved = 1, hr_reviewer_id = ?, hr_approved_by = ?, hr_approved_date = UTC_DATE(), hr_comments = ?
    WHERE id = ?`, [req.user.id, req.user.name, comments, p.id])
  await notify(p.user_id, { type: 'promotion', title: 'HR approved your promotion request', body: `${p.requested_position} is now with your manager.${comments ? ` “${comments}”` : ''}`, link: '/promotion' })
  await notifyRoles(['manager', 'admin'], { type: 'review', title: `${p.employee}’s promotion is ready for you`, body: `${p.current_position} → ${p.requested_position}`, link: '/reviews' }, req.user.id)
  res.json({ success: true })
})

router.put('/promotion-requests/:id/manager-final-approve', requireRole('manager', 'admin'), async (req, res) => {
  const p = await forReview(req)
  if (!['pending', 'on-hold'].includes(p.status)) fail(409, 'This request has already been decided.')
  const position = text(req.body.approvedPosition, { field: 'Approved position', max: 150 }) ?? p.requested_position
  const salary = Math.max(0, Number(req.body.approvedSalary) || 0)
  const rating = req.body.approvedRating == null || req.body.approvedRating === '' ? null : Number(req.body.approvedRating)
  if (rating != null && !(rating >= 0 && rating <= 5)) fail(400, 'Rating must be between 0 and 5.')
  const comments = text(req.body.comments, { field: 'Comments', max: 5000 })
  await tx(async (tq) => {
    await tq(`UPDATE promotion_requests SET status = 'approved', manager_approved = 1, manager_reviewer_id = ?, manager_approved_by = ?,
      manager_approved_date = UTC_DATE(), manager_approved_position = ?, manager_approved_salary = ?, manager_rating = ?, manager_comments = ?
      WHERE id = ?`, [req.user.id, req.user.name, position, salary, rating, comments, p.id])
    // the promotion takes effect on the employee's profile
    await tq(`UPDATE users SET position = ?, current_salary = IF(? > 0, ?, current_salary), performance_rating = COALESCE(?, performance_rating)
      WHERE id = ?`, [position, salary, salary, rating, p.user_id])
    await tq('UPDATE team_members SET member_role = ? WHERE user_id = ?', [position, p.user_id])
  })
  await notify(p.user_id, { type: 'promoted', title: 'You got the promotion 🎉', body: `Approved as ${position}.${comments ? ` “${comments}”` : ''}`, link: '/promotion' })
  res.json({ success: true })
})

router.put('/promotion-requests/:id/reject', requireRole(...STAFF), async (req, res) => {
  const p = await forReview(req)
  if (!['pending', 'on-hold'].includes(p.status)) fail(409, 'This request has already been decided.')
  const comments = text(req.body.comments, { field: 'Comments', max: 5000 })
  // HR can turn down a request it hasn't passed on yet; managers (and admins) can turn one down at any stage
  if (req.user.role === 'hr' && p.status !== 'pending') fail(403, 'This request is waiting for the manager.')
  const stage = req.user.role === 'hr' ? 'hr' : 'manager'
  await q(`UPDATE promotion_requests SET status = 'rejected', ${stage}_approved = 0, ${stage === 'hr' ? 'hr_reviewer_id' : 'manager_reviewer_id'} = ?,
    ${stage}_approved_by = ?, ${stage}_approved_date = UTC_DATE(), ${stage}_comments = ? WHERE id = ?`, [req.user.id, req.user.name, comments, p.id])
  await notify(p.user_id, { type: 'rejected', title: 'Promotion request not approved', body: comments ? `“${comments}”` : `${p.requested_position} — you can apply again later.`, link: '/promotion' })
  res.json({ success: true })
})

export default router
