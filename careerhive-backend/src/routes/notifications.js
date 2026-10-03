import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { one, q } from '../db.js'
import { fail, id } from '../http.js'
import { notificationOut } from '../mappers.js'
import { subscribe } from '../notify.js'

const router = Router()

/**
 * GET /api/notifications/stream?token=… — Server-Sent Events: an `event: notification` line each time something new
 * arrives for this user. EventSource can't send headers, so the JWT comes in the query string.
 */
export async function stream(req, res) {
  let userId
  try { userId = jwt.verify(String(req.query.token ?? ''), config.jwtSecret).sub } catch { /* checked below */ }
  if (!userId || !(await one('SELECT id FROM users WHERE id = ?', [userId]))) return res.status(401).json({ message: 'Invalid or expired token.' })
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
  res.flushHeaders()
  res.write('retry: 5000\n\n')
  const unsubscribe = subscribe(userId, res)
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000) // keeps proxies from closing an idle stream
  req.on('close', () => { clearInterval(ping); unsubscribe() })
}

router.get('/notifications', async (req, res) => {
  const rows = await q('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 60', [req.user.id])
  res.json({ notifications: rows.map(notificationOut) })
})

router.put('/notifications/read-all', async (req, res) => {
  await q('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id])
  res.json({ success: true })
})

router.put('/notifications/:id/read', async (req, res) => {
  const { affectedRows } = await q('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id(req.params.id), req.user.id])
  if (!affectedRows) fail(404, 'Notification not found.')
  res.json({ success: true })
})

export default router
