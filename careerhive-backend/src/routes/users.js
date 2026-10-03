import { Router } from 'express'
import { isOwner, requireOwner, requireRole } from '../auth.js'
import { one, q } from '../db.js'
import { fail, id, iso, STAFF, text } from '../http.js'
import { fullName, presence, USER_COLUMNS, userOut } from '../mappers.js'
import { notify } from '../notify.js'
import { removePostImage } from './social.js'

const router = Router()

// Only the fields present in the body change, so a partial update never wipes other columns.
const TEXT_FIELDS = {
  firstName: ['first_name', 100], lastName: ['last_name', 100], position: ['position', 150], department: ['department', 150],
  education: ['education', 255], location: ['location', 150], phone: ['phone', 50], bio: ['bio', 5000],
}
const PHOTO_FIELDS = { profilePhoto: 'profile_photo', coverPhoto: 'cover_photo' }
const PHOTO = /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+|https?:\/\/\S+)$/

router.put('/users/:id', async (req, res) => {
  const userId = id(req.params.id, 'user id')
  if (userId !== req.user.id && req.user.role !== 'admin') fail(403, 'Not authorized to update this profile.')
  const sets = [], values = []
  for (const [key, [column, max]] of Object.entries(TEXT_FIELDS)) {
    if (!(key in req.body)) continue
    const value = text(req.body[key], { field: key, max, required: key === 'firstName' })
    sets.push(`${column} = ?`); values.push(key === 'lastName' ? value ?? '' : value)
  }
  for (const [key, column] of Object.entries(PHOTO_FIELDS)) {
    if (!(key in req.body)) continue
    const value = req.body[key] || null
    if (value && (typeof value !== 'string' || value.length > 8_000_000 || !PHOTO.test(value))) fail(400, `${key} must be an image (data URL or http link) under 6 MB.`)
    sets.push(`${column} = ?`); values.push(value)
  }
  if (sets.length) await q(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...values, userId])
  const user = await one(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [userId])
  if (!user) fail(404, 'User not found.')
  res.json({ user: userOut(user) })
})

// People staff can assign formations to, add to teams, or review: employees, plus anyone who asked for a promotion.
router.get('/employees', requireRole(...STAFF), async (req, res) => {
  const rows = await q(`SELECT id, first_name, last_name, email, position, department, profile_photo, experience, current_salary, performance_rating
    FROM users WHERE role = 'student' OR id IN (SELECT user_id FROM promotion_requests) ORDER BY first_name, last_name`)
  res.json({
    employees: rows.map((u) => ({
      id: u.id, name: fullName(u), email: u.email, currentPosition: u.position ?? '', currentSalary: u.current_salary,
      avatar: u.profile_photo, department: u.department, experience: u.experience, performance: u.performance_rating,
    })),
  })
})

/* ---------- People & roles: the owner decides who is a manager or HR; everyone else signs up as an employee ---------- */

const ROLE_NAMES = { student: 'an employee', manager: 'a manager', hr: 'HR', admin: 'an admin' }

router.get('/people', requireOwner, async (req, res) => {
  const rows = await q(`SELECT id, first_name, last_name, email, role, position, department, profile_photo, oauth_provider,
    email_verified_at, last_seen_at, created_at FROM users ORDER BY created_at DESC, id DESC`)
  res.json({
    people: rows.map((u) => ({
      id: u.id, name: fullName(u) || u.email, email: u.email, role: u.role, position: u.position, department: u.department,
      avatar: u.profile_photo, signIn: u.oauth_provider ?? 'email', confirmed: !!u.email_verified_at,
      status: presence(u.last_seen_at), joinedAt: iso(u.created_at), isOwner: isOwner(u.email),
    })),
  })
})

router.put('/people/:id/role', requireOwner, async (req, res) => {
  const userId = id(req.params.id, 'user id')
  const role = req.body.role
  if (!['student', 'manager', 'hr'].includes(role)) fail(400, 'Choose employee, manager or HR.')
  const user = await one('SELECT id, email, role FROM users WHERE id = ?', [userId])
  if (!user) fail(404, 'User not found.')
  if (isOwner(user.email)) fail(403, 'The owner’s role is set in the server configuration (STAFF_EMAILS).')
  if (user.role !== role) {
    await q('UPDATE users SET role = ? WHERE id = ?', [role, userId])
    await notify(userId, { type: 'info', title: `You are now ${ROLE_NAMES[role]}`, body: `${req.user.name} changed your role.`, link: '/' })
  }
  res.json({ id: userId, role })
})

// Removing an account also removes what was theirs (skills, enrollments, requests, messages, notifications, team seats)
// through the foreign keys; records others made (formations, reviews, uploads) stay and just lose the author link.
router.delete('/people/:id', requireOwner, async (req, res) => {
  const user = await one('SELECT id, email FROM users WHERE id = ?', [id(req.params.id, 'user id')])
  if (!user) fail(404, 'User not found.')
  if (isOwner(user.email)) fail(403, 'The owner account can’t be deleted.')
  const images = await q('SELECT image_path FROM posts WHERE user_id = ? AND image_path IS NOT NULL', [user.id])
  await q('DELETE FROM users WHERE id = ?', [user.id]) // their posts, likes, comments and follows go with them
  images.forEach((p) => removePostImage(p.image_path))
  res.json({ deleted: true })
})

export default router
