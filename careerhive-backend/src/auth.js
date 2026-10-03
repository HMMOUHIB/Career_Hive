import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { one, q } from './db.js'
import { fail, HttpError } from './http.js'

export const signToken = (user) => jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })

/** Verify the Bearer JWT and load the caller; the role is read from the database, so changes apply immediately. */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) fail(401, 'Authentication required.')
  let payload
  try { payload = jwt.verify(token, config.jwtSecret) } catch { fail(401, 'Invalid or expired token.') }
  const user = await one('SELECT id, role, email, first_name, last_name FROM users WHERE id = ?', [payload.sub])
  if (!user) fail(401, 'Invalid or expired token.')
  req.user = { id: user.id, role: user.role, email: user.email, name: `${user.first_name} ${user.last_name}`.trim() }
  touch(user.id)
  next()
}

/** The workspace owner(s), listed in STAFF_EMAILS, decide who is a manager or HR. */
export const isOwner = (email) => config.staffEmails.includes(String(email ?? '').toLowerCase())
export const requireOwner = (req, res, next) =>
  next(isOwner(req.user.email) ? undefined : new HttpError(403, 'Only the workspace owner can change roles.'))

/** Allow only these roles through. */
export const requireRole = (...roles) => (req, res, next) =>
  next(roles.includes(req.user.role) ? undefined : new HttpError(403, 'You do not have permission to perform this action.'))

// Presence: remember when each user was last active, writing at most once a minute per user.
const lastTouch = new Map()
function touch(userId) {
  const now = Date.now()
  if (now - (lastTouch.get(userId) ?? 0) < 60_000) return
  lastTouch.set(userId, now)
  q('UPDATE users SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?', [userId]).catch((e) => console.warn('presence update failed:', e.message))
}
