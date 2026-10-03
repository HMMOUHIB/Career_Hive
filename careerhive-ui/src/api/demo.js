// In-browser stand-in for server.js so the UI runs without the backend.
// Same routes, same payloads, same status transitions.
import * as mock from '../data/mock'

const clone = (v) => structuredClone(v)
const today = () => new Date().toISOString().slice(0, 10)
const hhmm = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

let db = null
let meId = null
const reset = () => {
  db = {
    users: clone(mock.users), formations: clone(mock.formations), myFormations: clone(mock.myFormations),
    skills: clone(mock.skills), certificates: clone(mock.certificates), promotions: clone(mock.promotionRequests),
    formationRequests: clone(mock.formationRequests), teams: clone(mock.teams), chat: clone(mock.chat),
    employees: clone(mock.employees), seq: 500, resources: {}, resDone: new Set(),
  }
}
reset()

const me = () => Object.values(db.users).find((u) => u.id === meId)
const id = () => ++db.seq
const err = (status, message) => { const e = new Error(message); e.status = status; throw e }
const staff = () => ['manager', 'hr', 'admin'].includes(me()?.role) || err(403, 'You do not have permission to perform this action.')

export async function demoRequest(method, path, body = {}) {
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180))
  const m = (re) => path.match(re)
  let x

  if (method === 'POST' && path === '/api/auth/login') {
    await seedResources() // so progress already follows course content
    // demo: the email picks the role (hr@… / manager@…), anything else is an employee
    const role = /hr/i.test(body.email) ? 'hr' : /manager|sarra/i.test(body.email) ? 'manager' : 'student'
    meId = db.users[role].id
    return { token: `demo-${role}`, user: clone(me()) }
  }
  if (method === 'POST' && path === '/api/auth/signup') {
    const role = ['student', 'manager', 'hr'].includes(body.role) ? body.role : 'student'
    const [firstName, ...rest] = body.name.trim().split(' ')
    db.users[role] = { ...db.users[role], firstName, lastName: rest.join(' '), email: body.email }
    meId = db.users[role].id
    return { token: `demo-${role}`, user: clone(me()) }
  }
  if (!meId) {
    let t = ''
    try { t = localStorage.getItem('ch_token') || '' } catch { /* storage blocked */ }
    const role = t.replace('demo-', '')
    if (db.users[role]) meId = db.users[role].id
    else err(401, 'Invalid or expired token.')
  }

  if (method === 'GET' && path === '/api/auth/me') return { user: clone(me()) }
  if (method === 'GET' && path === '/api/dashboard') {
    const d = mock.dashboard(me().role)
    d.me.skills = db.skills.length
    d.me.certificates = db.certificates.length
    const done = db.myFormations.filter((f) => f.progress >= 100).length
    d.me.learning = { total: db.myFormations.length, active: db.myFormations.length - done, completed: done, avgProgress: Math.round(db.myFormations.reduce((s, f) => s + f.progress, 0) / (db.myFormations.length || 1)) }
    d.me.formations = clone(db.myFormations).sort((a, b) => (a.progress >= 100) - (b.progress >= 100)).slice(0, 4)
    const mine = db.promotions.filter((p) => p.employeeId === me().id).sort((a, b) => b.id - a.id)[0]
    d.me.promotion = mine ? { id: mine.id, status: mine.status, currentPosition: mine.currentPosition, requestedPosition: mine.requestedPosition, submittedDate: mine.submittedDate, hrApproval: mine.hrApproval, managerApproval: mine.managerApproval } : null
    d.me.formationRequests = db.formationRequests.filter((r) => r.userId === me().id).map((r) => ({ id: r.id, title: r.formationTitle, status: r.status, requestedAt: r.requestedAt })).slice(0, 3)
    if (d.org) {
      const statuses = { hr: ['pending'], manager: ['on-hold'], admin: ['pending', 'on-hold'] }[me().role]
      d.org.queue.promotions = db.promotions.filter((p) => statuses.includes(p.status)).map((p) => ({ id: p.id, status: p.status, employee: db.employees.find((e) => e.id === p.employeeId)?.name, photo: null, currentPosition: p.currentPosition, requestedPosition: p.requestedPosition, date: p.submittedDate }))
      d.org.queue.formations = db.formationRequests.filter((r) => statuses.includes(r.status)).map((r) => ({ id: r.id, status: r.status, employee: r.employeeName, photo: null, formation: r.formationTitle, date: r.requestedAt }))
      d.org.totals.promotionQueue = d.org.queue.promotions.length
      d.org.totals.formationQueue = d.org.queue.formations.length
    }
    return d
  }
  if (method === 'PUT' && (x = m(/^\/api\/users\/(\d+)$/))) {
    if (+x[1] !== me().id) err(403, 'Not authorized to update this profile.')
    const role = me().role
    const keys = ['firstName', 'lastName', 'position', 'department', 'education', 'bio', 'location', 'phone', 'profilePhoto', 'coverPhoto']
    keys.forEach((k) => { db.users[role][k] = body[k] ?? null })
    return { user: clone(me()) }
  }

  if (method === 'GET' && m(/^\/api\/skills\/\d+$/)) return { skills: clone(db.skills) }
  if (method === 'POST' && path === '/api/skills') { const s = { id: id(), name: body.skillName.trim() }; db.skills.push(s); return s }
  if (method === 'DELETE' && (x = m(/^\/api\/skills\/(\d+)$/))) { db.skills = db.skills.filter((s) => s.id !== +x[1]); return { deleted: true } }
  if (method === 'GET' && m(/^\/api\/certificates\/\d+$/)) return { certificates: clone(db.certificates) }
  if (method === 'POST' && path === '/api/certificates') { const c = { id: id(), name: body.certificateName.trim() }; db.certificates.push(c); return c }
  if (method === 'DELETE' && (x = m(/^\/api\/certificates\/(\d+)$/))) { db.certificates = db.certificates.filter((s) => s.id !== +x[1]); return { deleted: true } }

  if (method === 'GET' && path === '/api/teams') return { teams: clone(db.teams) }
  if (method === 'POST' && path === '/api/teams') {
    staff(); const t = { id: id(), name: body.name, manager: { name: body.managerName, role: body.managerRole || 'Manager', avatar: body.managerAvatar || null }, employees: [] }
    db.teams.push(t); return clone(t)
  }
  if (method === 'POST' && (x = m(/^\/api\/teams\/(\d+)\/members$/))) {
    staff()
    const acct = body.userId ? db.employees.find((e) => e.id === +body.userId) : null
    if (body.userId && !acct) err(404, 'User not found.')
    const team = db.teams.find((t) => t.id === +x[1])
    if (acct && team.employees.some((e) => e.userId === acct.id || e.name === acct.name)) err(409, 'This person is already in the team.')
    const mbr = { id: id(), userId: acct?.id ?? null, status: acct ? 'online' : undefined, name: body.name || acct?.name, avatar: body.avatar || null, role: body.role || acct?.currentPosition || null, rating: body.rating || null, feedback: body.feedback || null, completedTrainings: body.completedTrainings || 0, skills: body.skills || [] }
    db.teams.find((t) => t.id === +x[1]).employees.push(mbr); return clone(mbr)
  }
  if (method === 'PUT' && (x = m(/^\/api\/teams\/members\/(\d+)\/feedback$/))) {
    staff(); db.teams.forEach((t) => t.employees.forEach((e) => { if (e.id === +x[1]) Object.assign(e, { rating: body.rating, feedback: body.feedback }) }))
    return { id: x[1], rating: body.rating, feedback: body.feedback }
  }

  if (method === 'GET' && path === '/api/chat-messages') return { messages: clone(db.chat) }
  if (method === 'POST' && path === '/api/chat-messages') {
    const msg = { id: id(), contactId: body.contactId, text: body.text.trim(), sender: 'me', time: hhmm() }
    ;(db.chat[body.contactId] ??= []).push({ id: msg.id, text: msg.text, sender: 'me', time: msg.time })
    return msg
  }

  if (method === 'GET' && path === '/api/employees') { staff(); return { employees: clone(db.employees) } }

  if (method === 'GET' && path === '/api/promotion-requests') return { requests: clone(db.promotions).sort((a, b) => b.id - a.id) }
  if (method === 'POST' && path === '/api/promotion-requests') {
    if (!body.requestedPosition || !body.justification) err(400, 'Requested position and justification are required.')
    const p = {
      id: id(), employeeId: me().id, currentPosition: body.currentPosition || '', requestedPosition: body.requestedPosition,
      currentSalary: +body.currentSalary || 0, requestedSalary: +body.requestedSalary || 0, reason: body.justification,
      submittedDate: today(), status: 'pending', achievements: (body.achievements || '').split('\n').filter(Boolean),
      certificates: [], skills: body.skills || [], hrApproval: null, managerApproval: null, approvedPosition: null, approvedSalary: 0, approvedRating: 0,
    }
    db.promotions.push(p)
    if (!db.employees.some((e) => e.id === me().id)) db.employees.push({ id: me().id, name: `${me().firstName} ${me().lastName}`, currentPosition: me().position, currentSalary: 0, department: me().department })
    return { id: p.id, message: 'Promotion request submitted.' }
  }
  if (method === 'PUT' && (x = m(/^\/api\/promotion-requests\/(\d+)\/hr-review$/))) {
    if (!['hr', 'admin'].includes(me().role)) err(403, 'You do not have permission to perform this action.')
    const p = db.promotions.find((r) => r.id === +x[1])
    if (p?.status === 'pending') Object.assign(p, { status: 'on-hold', hrApproval: { approved: true, approvedBy: 'HR Director', approvedDate: today(), comments: body.comments } })
    return { success: true }
  }
  if (method === 'PUT' && (x = m(/^\/api\/promotion-requests\/(\d+)\/manager-final-approve$/))) {
    if (!['manager', 'admin'].includes(me().role)) err(403, 'You do not have permission to perform this action.')
    const p = db.promotions.find((r) => r.id === +x[1])
    if (p?.status === 'on-hold') {
      Object.assign(p, {
        status: 'approved', approvedPosition: body.approvedPosition, approvedSalary: +body.approvedSalary, approvedRating: +body.approvedRating,
        managerApproval: { approved: true, approvedBy: 'Manager', approvedDate: today(), approvedPosition: body.approvedPosition, approvedSalary: +body.approvedSalary, approvedRating: +body.approvedRating, comments: body.comments },
      })
      const u = Object.values(db.users).find((uu) => uu.id === p.employeeId); if (u) u.position = body.approvedPosition
    }
    return { success: true }
  }
  if (method === 'PUT' && (x = m(/^\/api\/promotion-requests\/(\d+)\/reject$/))) {
    staff(); const p = db.promotions.find((r) => r.id === +x[1])
    const verdict = { approved: false, approvedBy: me().role === 'hr' ? 'HR Director' : 'Manager', approvedDate: today(), comments: body.comments || null }
    if (p) Object.assign(p, { status: 'rejected' }, me().role === 'hr' ? { hrApproval: verdict } : { managerApproval: verdict })
    return { success: true }
  }

  if (method === 'GET' && path === '/api/formations') return { formations: clone(db.formations) }
  if (method === 'POST' && path === '/api/formations') {
    staff(); const f = { id: id(), title: body.title, description: body.description || '', duration: body.duration || '', instructor: body.instructor || '', level: body.level || 'Intermédiaire', category: body.category || '', available: true, iconUrl: body.iconUrl || null, skills: body.skills || [] }
    db.formations.unshift(f); return { id: f.id, message: 'Formation created.' }
  }
  if (method === 'DELETE' && (x = m(/^\/api\/formations\/(\d+)$/))) {
    staff()
    db.formations = db.formations.filter((f) => f.id !== +x[1])
    db.myFormations = db.myFormations.filter((p) => p.formationId !== +x[1])
    return { deleted: true }
  }
  if (method === 'POST' && (x = m(/^\/api\/formations\/(\d+)\/assign$/))) {
    staff()
    if (+body.userId === me().id || +body.userId === db.users.student.id) {
      if (db.myFormations.some((p) => p.formationId === +x[1])) err(409, 'This employee is already assigned to this formation.')
      const f = db.formations.find((ff) => ff.id === +x[1])
      db.myFormations.push({ id: id(), formationId: f.id, progress: 0, status: 'En cours', startedAt: today(), title: f.title, description: f.description, duration: f.duration, instructor: f.instructor, level: f.level, iconUrl: f.iconUrl })
    }
    return { message: 'Formation assigned successfully.' }
  }
  if (method === 'GET' && path === '/api/my-formations') return { formations: clone(db.myFormations) }
  if (method === 'PUT' && (x = m(/^\/api\/my-formations\/(\d+)\/progress$/))) {
    const p = db.myFormations.find((r) => r.id === +x[1])
    if (p) Object.assign(p, { progress: body.progress, status: body.progress >= 100 ? 'Terminée' : 'En cours' })
    return { success: true }
  }
  if (method === 'POST' && path === '/api/formation-requests') {
    if (!body.formationId || !body.motivation?.trim()) err(400, 'Formation and motivation are required.')
    const f = db.formations.find((ff) => ff.id === +body.formationId)
    const r = { id: id(), formationId: f.id, formationTitle: f.title, userId: me().id, employeeName: `${me().firstName} ${me().lastName}`, employeeAvatar: null, motivation: body.motivation.trim(), status: 'pending', requestedAt: today() }
    db.formationRequests.unshift(r); return { id: r.id, message: 'Request submitted.' }
  }
  if (method === 'GET' && path === '/api/formation-requests') { staff(); return { requests: clone(db.formationRequests) } }
  if (method === 'PUT' && (x = m(/^\/api\/formation-requests\/(\d+)\/hr-review$/))) {
    if (!['hr', 'admin'].includes(me().role)) err(403, 'You do not have permission to perform this action.')
    const r = db.formationRequests.find((q) => q.id === +x[1]); if (r?.status === 'pending') r.status = 'on-hold'
    return { success: true }
  }
  if (method === 'PUT' && (x = m(/^\/api\/formation-requests\/(\d+)\/manager-confirm$/))) {
    if (!['manager', 'admin'].includes(me().role)) err(403, 'You do not have permission to perform this action.')
    const r = db.formationRequests.find((q) => q.id === +x[1] && q.status === 'on-hold')
    if (!r) err(404, 'Request not found or not ready for confirmation.')
    r.status = 'approved'
    if (r.userId === db.users.student.id && !db.myFormations.some((p) => p.formationId === r.formationId)) {
      const f = db.formations.find((ff) => ff.id === r.formationId)
      db.myFormations.push({ id: id(), formationId: f.id, progress: 0, status: 'En cours', startedAt: today(), title: f.title, description: f.description, duration: f.duration, instructor: f.instructor, level: f.level, iconUrl: f.iconUrl })
    }
    return { success: true }
  }
  if (method === 'PUT' && (x = m(/^\/api\/formation-requests\/(\d+)\/reject$/))) {
    staff(); const r = db.formationRequests.find((q) => q.id === +x[1]); if (r) r.status = 'rejected'
    return { success: true }
  }

  if (path.startsWith('/api/notifications')) err(404, 'Not installed in demo — the feed is derived')
  if (method === 'PUT' && /^\/api\/chat-messages\/\d+\/read$/.test(path)) return { success: true }
  // ---------- course content ----------
  if ((x = m(/^\/api\/formations\/(\d+)\/resources$/)) && method === 'GET') {
    await seedResources()
    return { resources: (db.resources[+x[1]] ?? []).map((r) => ({ ...r, done: db.resDone.has(r.id) })) }
  }
  if ((x = m(/^\/api\/formations\/(\d+)\/resources\/link$/)) && method === 'POST') {
    staff(); await seedResources()
    if (!/^https?:\/\//i.test(body.url || '')) err(400, 'A valid http(s) link is required.')
    const r = { id: id(), formationId: +x[1], kind: 'link', title: body.title || body.url, url: body.url, fileName: null, size: null, createdAt: new Date().toISOString() }
    ;(db.resources[+x[1]] ??= []).push(r); return { resource: r }
  }
  if ((x = m(/^\/api\/formation-resources\/(\d+)$/))) {
    staff(); await seedResources()
    const all = Object.values(db.resources).flat(); const r = all.find((q) => q.id === +x[1])
    if (!r) err(404, 'Not found.')
    if (method === 'PATCH') { if (body.title != null) r.title = body.title; return { success: true } }
    if (method === 'DELETE') { db.resources[r.formationId] = db.resources[r.formationId].filter((q) => q.id !== r.id); db.resDone.delete(r.id); recompute(r.formationId); return { deleted: true } }
  }
  if ((x = m(/^\/api\/formation-resources\/(\d+)\/complete$/)) && method === 'POST') {
    await seedResources()
    const r = Object.values(db.resources).flat().find((q) => q.id === +x[1])
    if (!r) err(404, 'Not found.')
    if (!db.myFormations.some((f) => f.formationId === r.formationId)) err(403, 'You are not enrolled in this formation.')
    body.done === false ? db.resDone.delete(r.id) : db.resDone.add(r.id)
    return { progress: recompute(r.formationId) }
  }

  if (path === '/api/cv/analysis') return method === 'DELETE' ? demoDeleteCv() : demoCvAnalysis()
  const social = demoSocial(method, path, body)
  if (social !== undefined) return social

  err(404, `Demo route not found: ${method} ${path}`)
}

export const demoLogout = () => { meId = null }

/* ---------- demo CV coach: built from the demo profile and catalog (the real analysis runs on the server) ---------- */
let demoCv = null
const DEMO_SKILL_WORDS = ['AWS', 'Azure', 'Kubernetes', 'Docker', 'Terraform', 'Ansible', 'Linux', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'CI/CD', 'Grafana', 'Prometheus', 'Helm', 'Java', 'TypeScript', 'Figma', 'Leadership']
export async function demoAnalyzeCv(file) {
  await new Promise((r) => setTimeout(r, 900))
  const text = /\.(txt|md)$/i.test(file.name) ? await file.text() : ''
  const u = me()
  const found = [...new Set([...db.skills.map((s) => s.name), ...DEMO_SKILL_WORDS.filter((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`, 'i').test(text))])]
  const has = (s) => found.some((f) => f.toLowerCase() === s.toLowerCase())
  const gaps = ['Kubernetes', 'Terraform', 'Observability', 'Security', 'Helm'].filter((s) => !has(s)).map((name, i) => ({ name, priority: 96 - i * 11, taught: true }))
  const done = new Set(db.myFormations.filter((m) => m.progress >= 100).map((m) => m.formationId))
  const formations = db.formations.filter((f) => !done.has(f.id)).map((f) => {
    const fills = f.skills.filter((s) => gaps.some((g) => g.name.toLowerCase() === s.toLowerCase()))
    const builds = f.skills.filter(has)
    const enrolled = db.myFormations.find((m) => m.formationId === f.id)
    const reasons = [fills.length && `Fills a gap: ${fills.join(' and ')} ${fills.length > 1 ? 'aren’t' : 'isn’t'} on your CV yet`, builds.length && `Builds on your ${builds.join(' and ')} experience`, enrolled && `You’re already enrolled — ${enrolled.progress}% done, keep going`].filter(Boolean)
    return { id: f.id, title: f.title, level: f.level, category: f.category, duration: f.duration, instructor: f.instructor, iconUrl: f.iconUrl, skills: f.skills, match: Math.min(96, 30 + fills.length * 28 + builds.length * 10 - (enrolled ? 18 : 0)), reasons: reasons.length ? reasons : ['Widens your profile beyond your current stack'], enrolled: !!enrolled }
  }).sort((a, b) => b.match - a.match).slice(0, 3)
  const m = db.users.manager
  const title = (u.position || 'Cloud Engineer').replace(/\s+(I{1,3}|\d)$/, '')
  demoCv = {
    demo: true, title, track: 'infra', trackLabel: 'Cloud & infrastructure', years: 4, seniority: 'Mid-level', nextRole: `Senior ${title}`,
    skills: found.map((name) => ({ name, mentions: 1 })), newSkills: found.filter((f) => !db.skills.some((s) => s.name === f)),
    strength: { score: text ? 72 : 64, checks: [{ label: 'Experience', ok: true }, { label: 'Skills section', ok: true }, { label: 'Measured results', ok: false }, { label: 'Certifications', ok: true }], tips: ['Quantify results: “cut deploy time by 40 %”, “served 20k users”.', 'Show one or two projects with what you built and the result.'], words: 420 },
    gaps, formations,
    manager: { id: m.id, name: `${m.firstName} ${m.lastName}`, avatar: m.profilePhoto, position: m.position, department: m.department, teams: [{ name: 'Infra Squad', members: 6, rating: 4.4 }], teaches: gaps.slice(0, 2).map((g) => g.name), shared: found.slice(0, 2), match: 91, reasons: ['Leads Infra Squad (6 people)', `The team knows ${gaps.slice(0, 2).map((g) => g.name).join(' and ')} — what you need next`, 'Same department: Infrastructure', 'Team rating 4.4 / 5'] },
    otherManagers: [], sections: ['summary', 'experience', 'education', 'skills'], fileName: file.name, analyzedAt: new Date().toISOString(),
  }
  return clone(demoCv)
}
export const demoCvAnalysis = () => ({ analysis: demoCv ? clone(demoCv) : null })
export const demoDeleteCv = () => { demoCv = null; return { deleted: true } }

/* ---------- demo social: posts, likes, comments and follows among the demo accounts ---------- */
let net = null
const person = (u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), avatar: u.profilePhoto, position: u.position, department: u.department, role: u.role })
function socialDb() {
  if (net) return net
  const { student, hr, manager } = db.users
  const ago = (h) => new Date(Date.now() - h * 36e5).toISOString()
  net = {
    posts: [
      { id: 903, authorId: manager.id, body: 'Proud of the Infra Squad: the cluster migration landed with zero downtime. 🚀', image: null, createdAt: ago(3), likes: new Set([hr.id]), comments: [{ id: 9031, authorId: hr.id, body: 'Huge work, congrats to the whole team!', createdAt: ago(2) }] },
      { id: 902, authorId: hr.id, body: 'New in the catalog this month: Secure Cloud Networking and CI/CD with GitHub Actions. Ask for a seat from the Formations page.', image: null, createdAt: ago(26), likes: new Set([manager.id, student.id]), comments: [] },
      { id: 901, authorId: student.id, body: 'Finished Kubernetes in Production — the autoscaling module was my favourite part.', image: null, createdAt: ago(50), likes: new Set([manager.id]), comments: [] },
    ],
    follows: new Set([`${student.id}>${manager.id}`, `${manager.id}>${student.id}`, `${hr.id}>${manager.id}`]),
  }
  return net
}

/** The /api/feed, /api/profiles, /api/network, /api/posts and /api/comments routes; undefined for anything else. */
function demoSocial(method, path, body) {
  const url = new URL(path, 'http://demo')
  const p = url.pathname
  if (!/^\/api\/(feed|profiles|network|posts|comments)\b/.test(p)) return undefined
  const s = socialDb(), mine = me(), users = Object.values(db.users)
  const follows = (a, b) => s.follows.has(`${a}>${b}`)
  const staffer = mine.role !== 'student'
  const out = (q) => ({ id: q.id, authorId: q.authorId, body: q.body, image: q.image, createdAt: q.createdAt, likes: q.likes.size, comments: q.comments.length, liked: q.likes.has(mine.id), canDelete: q.authorId === mine.id || staffer })
  const page = (list) => {
    const before = Number(url.searchParams.get('before')) || Infinity
    const rest = list.filter((q) => q.id < before).sort((a, b) => b.id - a.id)
    const posts = rest.slice(0, 20)
    return { posts: posts.map(out), people: Object.fromEntries(users.filter((u) => posts.some((q) => q.authorId === u.id)).map((u) => [u.id, person(u)])), more: rest.length > 20 }
  }
  const post = (pid) => s.posts.find((q) => q.id === +pid) ?? err(404, 'Post not found.')
  const comment = (c, q) => ({ id: c.id, body: c.body, createdAt: c.createdAt, author: person(users.find((u) => u.id === c.authorId)), canDelete: c.authorId === mine.id || q.authorId === mine.id || staffer })
  let x

  if (method === 'GET' && p === '/api/feed') return page(s.posts.filter((q) => q.authorId === mine.id || follows(mine.id, q.authorId)))
  if (method === 'GET' && (x = p.match(/^\/api\/profiles\/(\d+)$/))) {
    const u = users.find((v) => v.id === +x[1]) ?? err(404, 'Person not found.')
    const isMe = u.id === mine.id
    return { profile: { ...person(u), bio: u.bio, location: u.location, education: u.education, cover: u.coverPhoto, joinedAt: '2024-09-02T08:00:00.000Z',
      skills: isMe ? db.skills.map((k) => k.name) : ['Leadership', 'Kubernetes'], certificates: isMe ? db.certificates.map((c) => ({ name: c.name, issuedDate: null })) : [],
      followers: [...s.follows].filter((f) => f.endsWith(`>${u.id}`)).length, following: [...s.follows].filter((f) => f.startsWith(`${u.id}>`)).length,
      posts: s.posts.filter((q) => q.authorId === u.id).length, isFollowing: follows(mine.id, u.id), followsYou: follows(u.id, mine.id), isMe } }
  }
  if (method === 'GET' && (x = p.match(/^\/api\/profiles\/(\d+)\/posts$/))) return page(s.posts.filter((q) => q.authorId === +x[1]))
  if ((x = p.match(/^\/api\/profiles\/(\d+)\/follow$/))) {
    if (+x[1] === mine.id) err(400, 'You can’t follow yourself.')
    if (method === 'POST') s.follows.add(`${mine.id}>${x[1]}`); else s.follows.delete(`${mine.id}>${x[1]}`)
    return { following: method === 'POST' }
  }
  if (method === 'GET' && p === '/api/network') {
    const others = users.filter((u) => u.id !== mine.id)
    return {
      following: others.filter((u) => follows(mine.id, u.id)).map(person), followers: others.filter((u) => follows(u.id, mine.id)).map(person),
      suggestions: others.filter((u) => !follows(mine.id, u.id)).map((u) => ({ ...person(u), teammate: u.department === mine.department, followsYou: follows(u.id, mine.id) })),
    }
  }
  if (method === 'POST' && p === '/api/posts') {
    if (!body.body?.trim() && !body.image) err(400, 'Write something or add an image.')
    const q = { id: id() + 1000, authorId: mine.id, body: body.body?.trim() ?? '', image: body.image ?? null, createdAt: new Date().toISOString(), likes: new Set(), comments: [] }
    s.posts.push(q)
    return page([q])
  }
  if (method === 'DELETE' && (x = p.match(/^\/api\/posts\/(\d+)$/))) {
    const q = post(x[1])
    if (q.authorId !== mine.id && !staffer) err(403, 'You can only delete your own posts.')
    s.posts = s.posts.filter((v) => v !== q)
    return { deleted: true }
  }
  if ((x = p.match(/^\/api\/posts\/(\d+)\/like$/))) {
    const q = post(x[1])
    if (method === 'POST') q.likes.add(mine.id); else q.likes.delete(mine.id)
    return { liked: method === 'POST', likes: q.likes.size }
  }
  if ((x = p.match(/^\/api\/posts\/(\d+)\/comments$/))) {
    const q = post(x[1])
    if (method === 'GET') return { comments: q.comments.map((c) => comment(c, q)) }
    if (!body.body?.trim()) err(400, 'Comment is required.')
    const c = { id: id() + 1000, authorId: mine.id, body: body.body.trim(), createdAt: new Date().toISOString() }
    q.comments.push(c)
    return { comment: comment(c, q) }
  }
  if (method === 'DELETE' && (x = p.match(/^\/api\/comments\/(\d+)$/))) {
    const q = s.posts.find((v) => v.comments.some((c) => c.id === +x[1])) ?? err(404, 'Comment not found.')
    q.comments = q.comments.filter((c) => c.id !== +x[1])
    return { deleted: true }
  }
  return undefined
}

/* ---------- demo course content ---------- */
let seeded = false
async function seedResources() {
  if (seeded) return
  seeded = true
  const { LESSON_1, LESSON_2 } = await import('../data/demoMedia')
  const R = (formationId, kind, title, extra = {}) => ({ id: id(), formationId, kind, title, fileName: null, size: null, url: '#demo', createdAt: '2026-09-01', ...extra })
  db.resources = {
    1: [
      R(1, 'video', 'Module 1 · Cluster architecture', { fileName: 'module-1-cluster-architecture.mp4', mime: 'video/mp4', size: 48_300_000, url: LESSON_1 }),
      R(1, 'file', 'Cluster architecture — slides', { fileName: 'cluster-architecture.pdf', mime: 'application/pdf', size: 2_450_000 }),
      R(1, 'file', 'kubectl cheat sheet', { fileName: 'kubectl-cheatsheet.docx', size: 184_000 }),
      R(1, 'video', 'Module 6 · Autoscaling with HPA', { fileName: 'module-6-hpa.mp4', mime: 'video/mp4', size: 61_900_000, url: LESSON_2 }),
      R(1, 'file', 'Lab manifests', { fileName: 'hpa-lab-manifests.zip', size: 36_000 }),
      R(1, 'file', 'Capacity planning sheet', { fileName: 'capacity-planning.xlsx', size: 92_000 }),
      R(1, 'link', 'Official Kubernetes docs', { url: 'https://kubernetes.io/docs/' }),
      R(1, 'file', 'Upgrade runbook', { fileName: 'upgrade-runbook.pptx', size: 5_800_000 }),
    ],
    4: [
      R(4, 'video', 'Signals 101 — metrics, logs, traces', { fileName: 'signals-101.mp4', mime: 'video/mp4', size: 38_000_000, url: LESSON_1 }),
      R(4, 'file', 'PromQL exercises', { fileName: 'promql-exercises.pdf', size: 820_000 }),
      R(4, 'file', 'Dashboard JSON', { fileName: 'service-overview.json', size: 14_000 }),
    ],
  }
  db.resDone = new Set([db.resources[1][0].id, db.resources[1][1].id, db.resources[1][2].id, db.resources[1][6].id, db.resources[1][4].id, db.resources[4][0].id])
  Object.keys(db.resources).forEach((fid) => recompute(+fid))
}
function recompute(fid) {
  const list = db.resources[fid] ?? []
  if (!list.length) return null
  const progress = Math.round((list.filter((r) => db.resDone.has(r.id)).length / list.length) * 100)
  const row = db.myFormations.find((f) => f.formationId === fid)
  if (row) Object.assign(row, { progress, status: progress >= 100 ? 'Terminée' : 'En cours' })
  return progress
}

/** Demo upload: files stay in this browser tab (object URLs) and progress is simulated. */
export async function demoUpload(fid, files, onProgress) {
  await seedResources()
  for (let p = 0; p <= 1; p += 0.1) { onProgress?.(p); await new Promise((r) => setTimeout(r, 90)) }
  const created = [...files].map((f) => ({
    id: id(), formationId: fid, kind: /^video\//.test(f.type) || /\.(mp4|webm|mov|m4v)$/i.test(f.name) ? 'video' : 'file',
    title: f.name.replace(/\.[^.]+$/, ''), fileName: f.name, mime: f.type, size: f.size, url: URL.createObjectURL(f), createdAt: new Date().toISOString(),
  }))
  ;(db.resources[fid] ??= []).push(...created)
  recompute(fid)
  return created
}
