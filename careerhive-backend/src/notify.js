// Stored notifications (GET /api/notifications). The UI shows these instead of deriving its own feed.
// Each open app tab also keeps a live stream (GET /api/notifications/stream): a new notification is pushed at once,
// so pop-ups don't wait for the UI's 20-second poll.
import { q } from './db.js'

const streams = new Map() // user id → open event-stream responses

/** Register a live stream for a user; returns the function that removes it. */
export function subscribe(userId, res) {
  if (!streams.has(userId)) streams.set(userId, new Set())
  streams.get(userId).add(res)
  return () => {
    streams.get(userId)?.delete(res)
    if (!streams.get(userId)?.size) streams.delete(userId)
  }
}

/** Wake up these users' open tabs (they then fetch what's new). */
export function publish(userIds, event = 'notification') {
  for (const id of userIds) for (const res of streams.get(id) ?? []) res.write(`event: ${event}\ndata: {}\n\n`)
}

/** Notify one or more users. `n` = { type, title, body?, link?, contactId? }. */
export async function notify(userIds, n) {
  const ids = [...new Set([userIds].flat().filter(Boolean))]
  if (!ids.length) return
  await q('INSERT INTO notifications (user_id, type, title, body, link, contact_id) VALUES ?',
    [ids.map((id) => [id, n.type, n.title.slice(0, 255), n.body ?? null, n.link ?? null, n.contactId ?? null])])
  publish(ids)
}

/** Notify every user holding one of `roles`, except `exceptId` (the person who caused the event). */
export async function notifyRoles(roles, n, exceptId) {
  const rows = await q('SELECT id FROM users WHERE role IN (?) AND id <> ?', [roles, exceptId ?? 0])
  await notify(rows.map((r) => r.id), n)
}

/** One unread notification per conversation: refresh it instead of stacking a new one per message. */
export async function notifyMessage(userId, { title, body, contactId }) {
  const res = await q(`UPDATE notifications SET title = ?, body = ?, created_at = UTC_TIMESTAMP()
    WHERE user_id = ? AND type = 'message' AND contact_id <=> ? AND is_read = 0`, [title, body, userId, contactId])
  if (res.affectedRows) publish([userId])
  else await notify(userId, { type: 'message', title, body, contactId })
}
