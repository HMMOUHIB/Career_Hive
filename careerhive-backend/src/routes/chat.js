// Chat between accounts. A "contact" is another user (its id is the user id):
//   managers, HR and admins can talk to everyone; employees to managers, HR, admins and their teammates.
import { Router } from 'express'
import { one, q } from '../db.js'
import { chatTime, fail, id, iso, isStaff, text } from '../http.js'
import { fullName, presence } from '../mappers.js'
import { notifyMessage } from '../notify.js'

const router = Router()
const ROLE_LABEL = { student: 'Employee', manager: 'Manager', hr: 'HR', admin: 'Admin' }

/** The people `user` may talk to. */
async function contactsOf(user) {
  if (isStaff(user)) {
    return q('SELECT id, first_name, last_name, email, role, position, profile_photo, last_seen_at FROM users WHERE id <> ? ORDER BY first_name, last_name', [user.id])
  }
  return q(`SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.position, u.profile_photo, u.last_seen_at FROM users u
    WHERE u.id <> ? AND (u.role IN ('manager', 'hr', 'admin') OR u.id IN (
      SELECT m.user_id FROM team_members m WHERE m.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)))
    ORDER BY u.first_name, u.last_name`, [user.id, user.id])
}

router.get('/contacts', async (req, res) => {
  const people = await contactsOf(req.user)
  const teams = await q('SELECT m.user_id, t.name FROM team_members m JOIN teams t ON t.id = m.team_id WHERE m.user_id IN (?) ORDER BY t.id', [[0, ...people.map((p) => p.id)]])
  res.json({
    contacts: people.map((u) => ({
      id: u.id, userId: u.id, name: fullName(u) || u.email, avatar: u.profile_photo, status: presence(u.last_seen_at),
      role: u.position || ROLE_LABEL[u.role], team: teams.find((t) => t.user_id === u.id)?.name ?? ROLE_LABEL[u.role],
      staff: u.role !== 'student',
    })),
  })
})

router.get('/chat-messages', async (req, res) => {
  const me = req.user.id
  const rows = await q(`SELECT id, sender_id, recipient_id, text, sent_at, read_at FROM chat_messages
    WHERE (sender_id = ? AND recipient_id IS NOT NULL) OR recipient_id = ? ORDER BY sent_at, id LIMIT 5000`, [me, me])
  const messages = {}
  for (const r of rows) {
    const mine = r.sender_id === me
    ;(messages[mine ? r.recipient_id : r.sender_id] ??= []).push({
      id: r.id, text: r.text, sender: mine ? 'me' : 'contact', time: chatTime(r.sent_at), at: iso(r.sent_at), read: !!r.read_at,
    })
  }
  res.json({ messages })
})

router.post('/chat-messages', async (req, res) => {
  const me = req.user
  const to = id(req.body.contactId, 'contact')
  const body = text(req.body.text, { field: 'Message', max: 4000, required: true })
  if (to === me.id) fail(400, 'You cannot message yourself.')
  if (!(await contactsOf(me)).some((c) => c.id === to)) {
    fail(await one('SELECT id FROM users WHERE id = ?', [to]) ? 403 : 404, 'You can message managers, HR and your teammates.')
  }
  const { insertId } = await q('INSERT INTO chat_messages (sender_id, recipient_id, text) VALUES (?, ?, ?)', [me.id, to, body])
  const { sent_at: sentAt } = await one('SELECT sent_at FROM chat_messages WHERE id = ?', [insertId])
  await notifyMessage(to, { title: me.name, body: body.slice(0, 200), contactId: me.id }) // opens this chat on their side
  res.status(201).json({ id: insertId, contactId: to, text: body, sender: 'me', time: chatTime(sentAt), at: iso(sentAt) })
})

router.put('/chat-messages/:contactId/read', async (req, res) => {
  const from = id(req.params.contactId, 'contact')
  await q('UPDATE chat_messages SET read_at = UTC_TIMESTAMP() WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL', [from, req.user.id])
  await q("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = 'message' AND contact_id = ?", [req.user.id, from])
  res.json({ success: true })
})

export default router
