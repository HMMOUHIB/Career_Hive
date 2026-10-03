// Skills and certificates on a profile. Anyone signed in can read a profile's; only its owner edits them.
import { Router } from 'express'
import { one, q } from '../db.js'
import { fail, id, text } from '../http.js'

const router = Router()

router.get('/skills/:userId', async (req, res) => {
  const rows = await q('SELECT id, skill_name, category, level FROM skills WHERE user_id = ? ORDER BY id', [id(req.params.userId, 'user id')])
  res.json({ skills: rows.map((s) => ({ id: s.id, name: s.skill_name, category: s.category, level: s.level })) })
})

router.post('/skills', async (req, res) => {
  const name = text(req.body.skillName, { field: 'Skill name', max: 150, required: true })
  if (await one('SELECT id FROM skills WHERE user_id = ? AND skill_name = ?', [req.user.id, name])) fail(409, 'This skill is already on your profile.')
  const { insertId } = await q('INSERT INTO skills (user_id, skill_name) VALUES (?, ?)', [req.user.id, name])
  res.status(201).json({ id: insertId, name })
})

router.delete('/skills/:id', async (req, res) => {
  const { affectedRows } = await q('DELETE FROM skills WHERE id = ? AND user_id = ?', [id(req.params.id), req.user.id])
  if (!affectedRows) fail(404, 'Skill not found.')
  res.json({ deleted: true })
})

router.get('/certificates/:userId', async (req, res) => {
  const rows = await q('SELECT id, certificate_name, issued_date FROM certificates WHERE user_id = ? ORDER BY id', [id(req.params.userId, 'user id')])
  res.json({ certificates: rows.map((c) => ({ id: c.id, name: c.certificate_name, issuedDate: c.issued_date })) })
})

router.post('/certificates', async (req, res) => {
  const name = text(req.body.certificateName, { field: 'Certificate name', max: 255, required: true })
  const { insertId } = await q('INSERT INTO certificates (user_id, certificate_name, issued_date) VALUES (?, ?, UTC_DATE())', [req.user.id, name])
  res.status(201).json({ id: insertId, name })
})

router.delete('/certificates/:id', async (req, res) => {
  const { affectedRows } = await q('DELETE FROM certificates WHERE id = ? AND user_id = ?', [id(req.params.id), req.user.id])
  if (!affectedRows) fail(404, 'Certificate not found.')
  res.json({ deleted: true })
})

export default router
