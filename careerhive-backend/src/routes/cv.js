// CV coach: upload a CV, get skills, experience, a CV score, skill gaps, the best formations and the best manager
// to learn from — matched against this company's real catalog and teams. The file and its text are never stored;
// only the latest result is kept (one per person) so the profile can show it again.
//   POST   /cv/analyze   multipart "cv" (.pdf, .docx, .txt, ≤ 8 MB) → { analysis }
//   GET    /cv/analysis  → { analysis | null }
//   DELETE /cv/analysis
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { analyzeCv } from '../cv/analyze.js'
import { cvText, CV_TYPES } from '../cv/extract.js'
import { one, q } from '../db.js'
import { fail, iso } from '../http.js'
import { fullName } from '../mappers.js'
import { skillsByFormation } from './formations.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  defParamCharset: 'utf8',
  fileFilter: (req, file, cb) => cb(CV_TYPES.includes(path.extname(file.originalname).toLowerCase()) ? null : Object.assign(new Error('Upload your CV as a PDF, a Word (.docx) or a text file.'), { status: 400 }), true),
})
const receive = (req, res, next) => upload.single('cv')(req, res, (e) => {
  if (!e) return next()
  next(Object.assign(e, { status: e.status ?? 400, message: e.code === 'LIMIT_FILE_SIZE' ? 'Your CV must be 8 MB or smaller.' : e.message }))
})

/** Everything the analysis matches against, read fresh from the database. */
async function contextFor(userId) {
  const [formations, enrollments, managers, teams, teamSkills, managerSkills, mine, profileSkills, companySkills, me] = await Promise.all([
    q('SELECT id, title, level, category, duration, instructor, icon_url FROM formations WHERE available = 1'),
    q('SELECT formation_id, progress FROM user_formation_progress WHERE user_id = ?', [userId]),
    q("SELECT id, first_name, last_name, profile_photo, position, department FROM users WHERE role = 'manager' AND id <> ?", [userId]),
    q('SELECT t.id, t.name, t.manager_user_id, COUNT(tm.id) AS members, AVG(tm.rating) AS rating FROM teams t LEFT JOIN team_members tm ON tm.team_id = t.id WHERE t.manager_user_id IS NOT NULL GROUP BY t.id, t.name, t.manager_user_id'),
    q(`SELECT t.manager_user_id AS manager, s.skill_name AS name FROM team_member_skills s JOIN team_members tm ON tm.id = s.team_member_id JOIN teams t ON t.id = tm.team_id
       UNION SELECT t.manager_user_id, sk.skill_name FROM skills sk JOIN team_members tm ON tm.user_id = sk.user_id JOIN teams t ON t.id = tm.team_id`),
    q("SELECT s.user_id AS manager, s.skill_name AS name FROM skills s JOIN users u ON u.id = s.user_id WHERE u.role = 'manager'"),
    q('SELECT DISTINCT t.manager_user_id AS id FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = ?', [userId]),
    q('SELECT skill_name AS name FROM skills WHERE user_id = ?', [userId]),
    q('SELECT skill_name AS name, COUNT(*) AS count FROM skills GROUP BY skill_name ORDER BY count DESC LIMIT 40'),
    one('SELECT department FROM users WHERE id = ?', [userId]),
  ])
  const skills = await skillsByFormation(formations.map((f) => f.id))
  const skillsOf = (id) => [...new Set([...teamSkills, ...managerSkills].filter((s) => s.manager === id).map((s) => s.name))]
  return {
    formations: formations.map((f) => ({ id: f.id, title: f.title, level: f.level, category: f.category, duration: f.duration, instructor: f.instructor, iconUrl: f.icon_url, skills: skills.get(f.id) ?? [] })),
    enrollments: Object.fromEntries(enrollments.map((e) => [e.formation_id, { progress: e.progress }])),
    managers: managers.map((m) => ({
      id: m.id, name: fullName(m), avatar: m.profile_photo, position: m.position, department: m.department, skills: skillsOf(m.id),
      teams: teams.filter((t) => t.manager_user_id === m.id).map((t) => ({ name: t.name, members: Number(t.members), rating: t.rating == null ? null : Number(t.rating) })),
    })),
    myManagerIds: new Set(mine.map((r) => r.id)),
    profileSkills: profileSkills.map((s) => s.name),
    companySkills: companySkills.map((s) => ({ name: s.name, count: Number(s.count) })),
    department: me?.department ?? null,
  }
}

const out = (row) => (row ? { ...JSON.parse(row.result), fileName: row.file_name, analyzedAt: iso(row.created_at) } : null)

router.post('/cv/analyze', receive, async (req, res) => {
  if (!req.file) fail(400, 'Choose your CV file first.')
  const text = await cvText(req.file.buffer, req.file.originalname)
  const result = analyzeCv(text, await contextFor(req.user.id))
  const fileName = req.file.originalname.slice(0, 255)
  await q(`INSERT INTO cv_analyses (user_id, file_name, result, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE file_name = VALUES(file_name), result = VALUES(result), created_at = VALUES(created_at)`, [req.user.id, fileName, JSON.stringify(result)])
  res.json({ analysis: out(await one('SELECT * FROM cv_analyses WHERE user_id = ?', [req.user.id])) })
})

router.get('/cv/analysis', async (req, res) => {
  res.json({ analysis: out(await one('SELECT * FROM cv_analyses WHERE user_id = ?', [req.user.id])) })
})

router.delete('/cv/analysis', async (req, res) => {
  await q('DELETE FROM cv_analyses WHERE user_id = ?', [req.user.id])
  res.json({ deleted: true })
})

export default router
