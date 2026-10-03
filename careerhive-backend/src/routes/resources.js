// Course content: videos, files and links per formation. A learner's progress = finished items / all items.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { requireRole } from '../auth.js'
import { config } from '../config.js'
import { one, q } from '../db.js'
import { fail, id, isStaff, STAFF, text } from '../http.js'
import { resourceOut } from '../mappers.js'
import { notify } from '../notify.js'

const router = Router()
const VIDEO = /\.(mp4|webm|mov|m4v|ogv)$/i
const BLOCKED = /\.(html?|svg|xhtml|js|mjs|php|exe|bat|cmd|sh|ps1)$/i // served from our origin, so no active content

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(config.uploadDir, 'formations', String(req.formation.id))
      fs.mkdir(dir, { recursive: true }, (e) => cb(e, dir))
    },
    // unguessable name: the files are served statically (a <video> can't send the auth header)
    filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname).toLowerCase().slice(0, 12)}`),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 20 },
  defParamCharset: 'utf8', // keep accented file names intact
  fileFilter: (req, file, cb) => cb(BLOCKED.test(file.originalname) ? Object.assign(new Error(`${file.originalname}: this file type is not allowed.`), { status: 400 }) : null, true),
})

async function loadFormation(req, res, next) {
  req.formation = await one('SELECT id, title FROM formations WHERE id = ?', [id(req.params.fid, 'formation id')])
  if (!req.formation) fail(404, 'Formation not found.')
  next()
}
const enrolled = (userId, formationId) => one('SELECT id FROM user_formation_progress WHERE user_id = ? AND formation_id = ?', [userId, formationId])

/** Tell everyone enrolled that the formation has new material. */
async function announce(formation, titles, byUserId) {
  const learners = await q('SELECT user_id FROM user_formation_progress WHERE formation_id = ? AND user_id <> ?', [formation.id, byUserId])
  const list = titles.slice(0, 3).join(', ') + (titles.length > 3 ? ` +${titles.length - 3} more` : '')
  await notify(learners.map((r) => r.user_id), { type: 'formation', title: `New content in “${formation.title}”`, body: list, link: `/formations?open=${formation.id}` })
}

/** Recompute progress for everyone enrolled (or one user) from finished items. Returns that user's progress. */
async function recompute(formationId, userId) {
  const { total } = await one('SELECT COUNT(*) AS total FROM formation_resources WHERE formation_id = ?', [formationId])
  if (!total) return null // no content: progress stays manual
  const who = userId ? 'AND p.user_id = ?' : ''
  const args = userId ? [formationId, total, formationId, userId] : [formationId, total, formationId]
  await q(`UPDATE user_formation_progress p SET p.progress = ROUND(100 * (SELECT COUNT(*) FROM resource_completions c
      JOIN formation_resources r ON r.id = c.resource_id WHERE r.formation_id = ? AND c.user_id = p.user_id) / ?)
    WHERE p.formation_id = ? ${who}`, args)
  await q(`UPDATE user_formation_progress SET status = IF(progress >= 100, 'Terminée', 'En cours'),
    completed_at = IF(progress >= 100, COALESCE(completed_at, UTC_TIMESTAMP()), NULL) WHERE formation_id = ? ${userId ? 'AND user_id = ?' : ''}`,
  userId ? [formationId, userId] : [formationId])
  return userId ? (await one('SELECT progress FROM user_formation_progress WHERE formation_id = ? AND user_id = ?', [formationId, userId]))?.progress ?? null : null
}

router.get('/formations/:fid/resources', loadFormation, async (req, res) => {
  const rows = await q('SELECT * FROM formation_resources WHERE formation_id = ? ORDER BY id', [req.formation.id])
  const done = new Set((await q(`SELECT c.resource_id FROM resource_completions c JOIN formation_resources r ON r.id = c.resource_id
    WHERE c.user_id = ? AND r.formation_id = ?`, [req.user.id, req.formation.id])).map((r) => r.resource_id))
  // the list is public to signed-in users (it's the syllabus); the content itself only to staff and enrolled learners
  const open = isStaff(req.user) || !!(await enrolled(req.user.id, req.formation.id))
  res.json({ resources: rows.map((r) => ({ ...resourceOut(r, done.has(r.id)), url: open ? r.url : null })) })
})

router.post('/formations/:fid/resources', requireRole(...STAFF), loadFormation, upload.array('files', 20), async (req, res) => {
  if (!req.files?.length) fail(400, 'Choose at least one file.')
  const created = []
  for (const f of req.files) {
    const kind = f.mimetype.startsWith('video/') || VIDEO.test(f.originalname) ? 'video' : 'file'
    const rel = path.relative(config.uploadDir, f.path).split(path.sep).join('/')
    const title = f.originalname.replace(/\.[^.]+$/, '').slice(0, 255) || f.originalname
    const { insertId } = await q(`INSERT INTO formation_resources (formation_id, kind, title, url, file_name, mime, size, storage_path, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.formation.id, kind, title, `/uploads/${rel}`, f.originalname.slice(0, 255), f.mimetype, f.size, rel, req.user.id])
    created.push(resourceOut(await one('SELECT * FROM formation_resources WHERE id = ?', [insertId])))
  }
  await recompute(req.formation.id)
  await announce(req.formation, created.map((r) => r.title), req.user.id)
  res.status(201).json({ resources: created })
})

router.post('/formations/:fid/resources/link', requireRole(...STAFF), loadFormation, async (req, res) => {
  const url = text(req.body.url, { field: 'Link', max: 1000 })
  if (!url || !/^https?:\/\/\S+$/i.test(url)) fail(400, 'A valid http(s) link is required.')
  const { insertId } = await q("INSERT INTO formation_resources (formation_id, kind, title, url, created_by) VALUES (?, 'link', ?, ?, ?)",
    [req.formation.id, text(req.body.title, { field: 'Title', max: 255 }) ?? url.slice(0, 255), url, req.user.id])
  await recompute(req.formation.id)
  const resource = resourceOut(await one('SELECT * FROM formation_resources WHERE id = ?', [insertId]))
  await announce(req.formation, [resource.title], req.user.id)
  res.status(201).json({ resource })
})

router.patch('/formation-resources/:rid', requireRole(...STAFF), async (req, res) => {
  const title = text(req.body.title, { field: 'Title', max: 255, required: true })
  const { affectedRows } = await q('UPDATE formation_resources SET title = ? WHERE id = ?', [title, id(req.params.rid)])
  if (!affectedRows) fail(404, 'Not found.')
  res.json({ success: true })
})

router.delete('/formation-resources/:rid', requireRole(...STAFF), async (req, res) => {
  const r = await one('SELECT id, formation_id, storage_path FROM formation_resources WHERE id = ?', [id(req.params.rid)])
  if (!r) fail(404, 'Not found.')
  await q('DELETE FROM formation_resources WHERE id = ?', [r.id])
  if (r.storage_path) {
    const file = path.resolve(config.uploadDir, r.storage_path)
    if (file.startsWith(config.uploadDir + path.sep)) fs.promises.unlink(file).catch(() => {})
  }
  await recompute(r.formation_id)
  res.json({ deleted: true })
})

router.post('/formation-resources/:rid/complete', async (req, res) => {
  const r = await one('SELECT id, formation_id FROM formation_resources WHERE id = ?', [id(req.params.rid)])
  if (!r) fail(404, 'Not found.')
  if (!(await enrolled(req.user.id, r.formation_id))) fail(403, 'You are not enrolled in this formation.')
  if (req.body.done === false) await q('DELETE FROM resource_completions WHERE user_id = ? AND resource_id = ?', [req.user.id, r.id])
  else await q('INSERT IGNORE INTO resource_completions (user_id, resource_id) VALUES (?, ?)', [req.user.id, r.id])
  res.json({ progress: await recompute(r.formation_id, req.user.id) })
})

export default router
