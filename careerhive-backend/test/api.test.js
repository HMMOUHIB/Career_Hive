// End-to-end tests against a real MySQL/MariaDB: `npm test` (uses the database TEST_DB_NAME, default careerhive_test,
// which it drops and re-seeds). The server in .env's DB_HOST/DB_USER must be running.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'

process.env.DB_NAME = process.env.TEST_DB_NAME || 'careerhive_test'
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'careerhive-test-uploads')
process.env.SIGNUP_ROLES = 'student'
process.env.STAFF_EMAILS = 'owner@careerhive.tn'
process.env.AUTH_RATE_LIMIT = '1000'
process.env.NODE_ENV = 'test'
process.env.SMTP_HOST = ''
for (const p of ['GOOGLE', 'LINKEDIN', 'GITHUB']) process.env[`${p}_CLIENT_ID`] = '' // tests never talk to the real providers

const { setupDatabase } = await import('../scripts/db.js')
const { app } = await import('../src/app.js')
const { pool } = await import('../src/db.js')
const { outbox } = await import('../src/mail.js')

let server, base
const tokens = {}

/** The link in the newest email sent to `to`. */
const linkTo = (to) => [...outbox].reverse().find((m) => m.to === to).text.match(/https?:\/\/\S+/)[0]
/** Open an emailed API link on the test server; returns where it redirects. */
const follow = async (link) => {
  const u = new URL(link)
  const res = await fetch(base + u.pathname + u.search, { redirect: 'manual' })
  return res.headers.get('location')
}

async function call(method, url, { as, body, form } = {}) {
  const headers = {}
  if (as) headers.Authorization = `Bearer ${tokens[as]}`
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(base + url, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}
const login = async (who, email) => {
  const r = await call('POST', '/api/auth/login', { body: { email, password: 'demo1234' } })
  assert.equal(r.status, 200, r.data.message)
  tokens[who] = r.data.token
  return r.data.user
}

before(async () => {
  await setupDatabase({ reset: true, demo: true, log: () => {} })
  server = app.listen(0)
  base = `http://127.0.0.1:${server.address().port}`
  await Promise.all([
    login('amine', 'amine@careerhive.tn'), login('hr', 'hr@careerhive.tn'), login('manager', 'manager@careerhive.tn'),
    login('yassine', 'yassine@careerhive.tn'), login('nour', 'nour@careerhive.tn'), login('hela', 'hela@careerhive.tn'),
  ])
})
after(async () => {
  server.close()
  await pool.end()
})

describe('auth', () => {
  test('rejects bad credentials and missing tokens', async () => {
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'amine@careerhive.tn', password: 'nope' } })).status, 401)
    assert.equal((await call('GET', '/api/auth/me')).status, 401)
    assert.equal((await call('GET', '/api/dashboard', { as: 'amine' })).status, 200)
  })

  test('me returns the profile shape the UI uses', async () => {
    const { data } = await call('GET', '/api/auth/me', { as: 'amine' })
    assert.deepEqual(Object.keys(data.user).sort(), ['bio', 'coverPhoto', 'department', 'education', 'email', 'firstName', 'id', 'isOwner', 'lastName', 'location', 'phone', 'position', 'profilePhoto', 'role'].sort())
    assert.equal(data.user.role, 'student')
    assert.equal(data.user.isOwner, false)
  })

  test('sign-up: validation, allowed roles, duplicates', async () => {
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Test User', email: 'test@x.tn', password: 'short' } })).status, 400)
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Test User', email: 'test@x.tn', password: 'longenough', role: 'hr' } })).status, 403)
    const ok = await call('POST', '/api/auth/signup', { body: { name: 'Test  User Jr', email: 'Test@X.tn', password: 'longenough', role: 'student' } })
    assert.equal(ok.status, 201)
    assert.deepEqual([ok.data.verificationRequired, ok.data.email, ok.data.token], [true, 'test@x.tn', undefined])
    assert.equal(outbox.at(-1).to, 'test@x.tn')
    assert.equal((await call('POST', '/api/auth/signup', { body: { name: 'Again', email: 'test@x.tn', password: 'longenough' } })).status, 409)
  })

  test('email confirmation gates sign-in; the link signs you in once', async () => {
    const early = await call('POST', '/api/auth/login', { body: { email: 'test@x.tn', password: 'longenough' } })
    assert.deepEqual([early.status, early.data.code], [403, 'EMAIL_NOT_VERIFIED'])
    // resending replaces the link: the first one stops working
    const first = linkTo('test@x.tn')
    assert.equal((await call('POST', '/api/auth/resend-verification', { body: { email: 'test@x.tn' } })).status, 200)
    const second = linkTo('test@x.tn')
    assert.notEqual(first, second)
    assert.match(await follow(first), /\/auth\?error=verify_expired$/)
    const landing = await follow(second)
    assert.match(landing, /\/oauth-success\?token=/)
    tokens.tester = new URL(landing).searchParams.get('token')
    assert.equal((await call('GET', '/api/auth/me', { as: 'tester' })).data.user.email, 'test@x.tn')
    assert.match(await follow(second), /\/auth\?notice=verified$/) // opening it again: already confirmed
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'test@x.tn', password: 'longenough' } })).status, 200)
    assert.equal((await call('POST', '/api/auth/resend-verification', { body: { email: 'nobody@x.tn' } })).status, 200) // no account probing
  })

  test('owner emails become managers', async () => {
    const owner = await call('POST', '/api/auth/signup', { body: { name: 'Owner', email: 'OWNER@careerhive.tn', password: 'longenough' } })
    assert.equal(owner.status, 201)
    tokens.owner = new URL(await follow(linkTo('owner@careerhive.tn'))).searchParams.get('token')
    assert.equal((await call('GET', '/api/auth/me', { as: 'owner' })).data.user.role, 'manager')
  })

  test('forgot password → emailed link → new password', async () => {
    assert.equal((await call('POST', '/api/auth/forgot-password', { body: { email: 'nobody@x.tn' } })).status, 200)
    assert.equal((await call('POST', '/api/auth/forgot-password', { body: { email: 'test@x.tn' } })).status, 200)
    const token = new URL(linkTo('test@x.tn')).searchParams.get('reset')
    assert.equal((await call('POST', '/api/auth/reset-password', { body: { token, password: 'short' } })).status, 400)
    assert.equal((await call('POST', '/api/auth/reset-password', { body: { token: 'forged', password: 'brandnewpass' } })).data.code, 'RESET_TOKEN_INVALID')
    const reset = await call('POST', '/api/auth/reset-password', { body: { token, password: 'brandnewpass' } })
    assert.equal(reset.status, 200)
    assert.ok(reset.data.token)
    assert.equal((await call('POST', '/api/auth/reset-password', { body: { token, password: 'again123456' } })).status, 400) // single use
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'test@x.tn', password: 'longenough' } })).status, 401)
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'test@x.tn', password: 'brandnewpass' } })).status, 200)
  })

  test('OAuth without credentials redirects back to the UI', async () => {
    const res = await fetch(`${base}/api/auth/google`, { redirect: 'manual' })
    assert.equal(res.status, 302)
    assert.match(res.headers.get('location'), /\/auth\?error=not_configured$/)
  })
})

describe('people & roles', () => {
  test('new accounts are employees; only the owner chooses managers and HR', async () => {
    const owner = (await call('GET', '/api/auth/me', { as: 'owner' })).data.user
    assert.deepEqual([owner.role, owner.isOwner], ['manager', true])
    assert.equal((await call('GET', '/api/auth/me', { as: 'tester' })).data.user.role, 'student') // signed up with email
    // a manager who isn't the owner can't see or change roles
    assert.equal((await call('GET', '/api/people', { as: 'manager' })).status, 403)
    assert.equal((await call('PUT', '/api/people/7/role', { as: 'manager', body: { role: 'manager' } })).status, 403)

    const people = (await call('GET', '/api/people', { as: 'owner' })).data.people
    assert.ok(people.some((p) => p.email === 'amine@careerhive.tn' && p.role === 'student' && p.signIn === 'email'))
    assert.equal(people.find((p) => p.isOwner).email, 'owner@careerhive.tn')

    assert.equal((await call('PUT', '/api/people/7/role', { as: 'owner', body: { role: 'admin' } })).status, 400)
    assert.equal((await call('PUT', `/api/people/${owner.id}/role`, { as: 'owner', body: { role: 'student' } })).status, 403)
    assert.deepEqual((await call('PUT', '/api/people/7/role', { as: 'owner', body: { role: 'manager' } })).data, { id: 7, role: 'manager' })
    assert.equal((await call('GET', '/api/auth/me', { as: 'amine' })).data.user.role, 'manager') // takes effect at once
    assert.equal((await call('GET', '/api/notifications', { as: 'amine' })).data.notifications[0].title, 'You are now a manager')
    await call('PUT', '/api/people/7/role', { as: 'owner', body: { role: 'student' } }) // back, for the tests below
  })

  test('the owner can delete accounts (but not their own)', async () => {
    const owner = (await call('GET', '/api/auth/me', { as: 'owner' })).data.user
    const tester = (await call('GET', '/api/auth/me', { as: 'tester' })).data.user
    assert.equal((await call('DELETE', `/api/people/${tester.id}`, { as: 'manager' })).status, 403)
    assert.equal((await call('DELETE', `/api/people/${owner.id}`, { as: 'owner' })).status, 403)
    assert.equal((await call('DELETE', '/api/people/99999', { as: 'owner' })).status, 404)
    await call('POST', '/api/skills', { as: 'tester', body: { skillName: 'Go' } })
    assert.deepEqual((await call('DELETE', `/api/people/${tester.id}`, { as: 'owner' })).data, { deleted: true })
    assert.equal((await call('GET', '/api/auth/me', { as: 'tester' })).status, 401) // their session ends
    assert.ok(!(await call('GET', '/api/people', { as: 'owner' })).data.people.some((p) => p.id === tester.id))
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'test@x.tn', password: 'brandnewpass' } })).status, 401)
  })
})

describe('dashboard', () => {
  test('employee: own panel, no org panel', async () => {
    const { data } = await call('GET', '/api/dashboard', { as: 'amine' })
    assert.equal(data.role, 'student')
    assert.equal(data.org, null)
    assert.equal(data.me.learning.total, 5)
    assert.ok(data.me.formations.length <= 4 && data.me.recommended.length === 3)
    assert.equal(data.me.team.name, 'Infra Squad')
    assert.equal(data.me.team.rating, 4.4)
    assert.equal(data.me.trends.enrollments.length, 8)
    assert.equal(data.me.promotion.status, 'approved')
    assert.ok(data.me.activity.length > 0)
  })

  test('HR sees the pending queue, the manager the on-hold one', async () => {
    const hr = (await call('GET', '/api/dashboard', { as: 'hr' })).data.org
    assert.deepEqual(hr.queue.promotions.map((p) => p.employee), ['Hela Zouari'])
    assert.deepEqual(hr.queue.formations.map((f) => f.employee), ['Nour Gharbi'])
    assert.equal(hr.totals.users, 16) // 15 seeded + two sign-ups - the one deleted above
    assert.equal(hr.promotionPipeline.pending, 1)
    const mgr = (await call('GET', '/api/dashboard', { as: 'manager' })).data.org
    assert.deepEqual(mgr.queue.promotions.map((p) => p.employee), ['Firas Ayari', 'Hela Zouari']) // managers decide pending ones too
    assert.deepEqual(mgr.queue.formations.map((f) => f.employee), ['Amine Trabelsi', 'Nour Gharbi'])
  })
})

describe('promotions', () => {
  test('employees only see their own requests', async () => {
    const mine = (await call('GET', '/api/promotion-requests', { as: 'amine' })).data.requests
    assert.deepEqual(mine.map((r) => r.id), [4])
    assert.deepEqual(mine[0].certificates, ['AWS Solutions Architect – Associate'])
    assert.equal((await call('GET', '/api/promotion-requests', { as: 'hr' })).data.requests.length, 3)
  })

  test('full flow: submit → HR review → manager approve, with notifications', async () => {
    const sent = await call('POST', '/api/promotion-requests', { as: 'nour', body: { requestedPosition: 'Cloud Engineer II', justification: 'Owned the backup rework.', achievements: 'Backups\nOn-call', skills: ['AWS'] } })
    assert.equal(sent.status, 201)
    assert.equal((await call('POST', '/api/promotion-requests', { as: 'nour', body: { requestedPosition: 'X', justification: 'Y' } })).status, 409)
    assert.ok((await call('GET', '/api/notifications', { as: 'hr' })).data.notifications.some((n) => n.title === 'Nour Gharbi asks for a promotion'))

    assert.ok((await call('GET', '/api/notifications', { as: 'manager' })).data.notifications.some((n) => n.title === 'Nour Gharbi asks for a promotion'))
    assert.equal((await call('PUT', `/api/promotion-requests/${sent.data.id}/hr-review`, { as: 'amine', body: {} })).status, 403)
    assert.equal((await call('PUT', `/api/promotion-requests/${sent.data.id}/hr-review`, { as: 'hr', body: { comments: 'Good file' } })).status, 200)
    const approve = await call('PUT', `/api/promotion-requests/${sent.data.id}/manager-final-approve`, { as: 'manager', body: { approvedPosition: 'Cloud Engineer II', approvedSalary: 2600, approvedRating: 4.5, comments: 'Congrats' } })
    assert.equal(approve.status, 200)

    const [req] = (await call('GET', '/api/promotion-requests', { as: 'nour' })).data.requests
    assert.equal(req.status, 'approved')
    assert.equal(req.hrApproval.comments, 'Good file')
    assert.equal(req.managerApproval.approvedSalary, 2600)
    assert.deepEqual(req.achievements, ['Backups', 'On-call'])
    assert.equal((await call('GET', '/api/auth/me', { as: 'nour' })).data.user.position, 'Cloud Engineer II')
    const notes = (await call('GET', '/api/notifications', { as: 'nour' })).data.notifications
    assert.deepEqual(notes.slice(0, 2).map((n) => n.type), ['promoted', 'promotion'])
  })

  test('HR decides pending requests; the manager can decide at any stage', async () => {
    assert.equal((await call('PUT', '/api/promotion-requests/10/reject', { as: 'hr', body: {} })).status, 403) // already with the manager
    const r = await call('PUT', '/api/promotion-requests/9/reject', { as: 'manager', body: { comments: 'Next cycle' } })
    assert.equal(r.status, 200)
    assert.equal((await call('PUT', '/api/promotion-requests/9/reject', { as: 'hr', body: {} })).status, 409)
    const [hela] = (await call('GET', '/api/promotion-requests', { as: 'hela' })).data.requests
    assert.deepEqual([hela.status, hela.managerApproval.approved, hela.managerApproval.comments], ['rejected', false, 'Next cycle'])
  })
})

describe('formations', () => {
  test('request → HR review → manager confirm enrolls the employee', async () => {
    const sent = await call('POST', '/api/formation-requests', { as: 'amine', body: { formationId: 8, motivation: 'Multi-cloud work' } })
    assert.equal(sent.status, 201)
    assert.equal((await call('POST', '/api/formation-requests', { as: 'amine', body: { formationId: 8, motivation: 'again' } })).status, 409)
    assert.equal((await call('POST', '/api/formation-requests', { as: 'amine', body: { formationId: 1, motivation: 'already in it' } })).status, 409)
    assert.ok((await call('GET', '/api/notifications', { as: 'manager' })).data.notifications.some((n) => n.title === 'Amine Trabelsi wants to join a formation'))
    assert.equal((await call('PUT', `/api/formation-requests/${sent.data.id}/hr-review`, { as: 'hr' })).status, 200)
    assert.equal((await call('PUT', `/api/formation-requests/${sent.data.id}/manager-confirm`, { as: 'manager' })).status, 200)
    assert.equal((await call('PUT', `/api/formation-requests/${sent.data.id}/manager-confirm`, { as: 'manager' })).status, 409)
    const mine = (await call('GET', '/api/my-formations', { as: 'amine' })).data.formations
    assert.ok(mine.some((f) => f.formationId === 8 && f.progress === 0 && f.status === 'En cours'))
  })

  test('a manager can confirm a request HR has not seen yet', async () => {
    assert.equal((await call('PUT', '/api/formation-requests/33/manager-confirm', { as: 'manager' })).status, 200) // Nour, pending
    assert.ok((await call('GET', '/api/my-formations', { as: 'nour' })).data.formations.some((f) => f.formationId === 1))
  })

  test('staff create and assign; duplicates are refused', async () => {
    assert.equal((await call('POST', '/api/formations', { as: 'amine', body: { title: 'Nope' } })).status, 403)
    const made = await call('POST', '/api/formations', { as: 'manager', body: { title: 'Rust for SREs', level: 'Avancé', skills: ['Rust', 'Rust', 'Tokio'] } })
    assert.equal(made.status, 201)
    const created = (await call('GET', '/api/formations', { as: 'amine' })).data.formations.find((f) => f.id === made.data.id)
    assert.deepEqual(created.skills, ['Rust', 'Tokio'])
    const heard = (await call('GET', '/api/notifications', { as: 'amine' })).data.notifications.find((n) => n.title === 'New formation: Rust for SREs')
    assert.equal(heard.link, `/formations?open=${made.data.id}`) // employees hear about new formations
    assert.equal((await call('POST', `/api/formations/${made.data.id}/assign`, { as: 'manager', body: { userId: 7 } })).status, 201)
    assert.equal((await call('POST', `/api/formations/${made.data.id}/assign`, { as: 'manager', body: { userId: 7 } })).status, 409)
  })

  test('HR and managers run the catalog but never join it; removing a formation takes its enrollments along', async () => {
    const fid = (await call('POST', '/api/formations', { as: 'hr', body: { title: 'Temporary course' } })).data.id
    const staffHeard = (await call('GET', '/api/notifications', { as: 'manager' })).data.notifications.some((n) => n.title === 'New formation: Temporary course')
    assert.equal(staffHeard, false)
    assert.equal((await call('POST', '/api/formation-requests', { as: 'manager', body: { formationId: fid, motivation: 'Me too' } })).status, 403)
    const hrId = (await call('GET', '/api/auth/me', { as: 'hr' })).data.user.id
    assert.equal((await call('POST', `/api/formations/${fid}/assign`, { as: 'manager', body: { userId: hrId } })).status, 400)
    const amineId = (await call('GET', '/api/auth/me', { as: 'amine' })).data.user.id
    assert.equal((await call('POST', `/api/formations/${fid}/assign`, { as: 'manager', body: { userId: amineId } })).status, 201)

    assert.equal((await call('DELETE', `/api/formations/${fid}`, { as: 'amine' })).status, 403)
    assert.equal((await call('DELETE', `/api/formations/${fid}`, { as: 'hr' })).status, 200)
    assert.equal((await call('DELETE', `/api/formations/${fid}`, { as: 'hr' })).status, 404)
    const mine = (await call('GET', '/api/my-formations', { as: 'amine' })).data.formations
    assert.equal(mine.some((m) => m.formationId === fid), false)
    const told = (await call('GET', '/api/notifications', { as: 'amine' })).data.notifications.find((n) => n.title === 'Formation removed')
    assert.match(told.body, /Temporary course/)
  })

  test('manual progress is limited to your own enrollments', async () => {
    assert.equal((await call('PUT', '/api/my-formations/105/progress', { as: 'amine', body: { progress: 100 } })).status, 200)
    assert.equal((await call('PUT', '/api/my-formations/105/progress', { as: 'nour', body: { progress: 50 } })).status, 404)
    assert.equal((await call('PUT', '/api/my-formations/105/progress', { as: 'amine', body: { progress: 140 } })).status, 400)
    const row = (await call('GET', '/api/my-formations', { as: 'amine' })).data.formations.find((f) => f.id === 105)
    assert.equal(row.status, 'Terminée')
  })
})

describe('course content', () => {
  test('upload, access rules, completion drives progress, delete removes the file', async () => {
    const form = new FormData()
    form.append('files', new Blob(['hello world'], { type: 'application/pdf' }), 'Résumé des labs.pdf')
    const up = await call('POST', '/api/formations/5/resources', { as: 'manager', form })
    assert.equal(up.status, 201, up.data.message)
    const [res] = up.data.resources
    assert.equal(res.title, 'Résumé des labs')
    assert.equal(res.kind, 'file')
    const served = await fetch(base + res.url)
    assert.equal(await served.text(), 'hello world')

    assert.equal((await call('POST', '/api/formations/5/resources/link', { as: 'manager', body: { url: 'ftp://nope' } })).status, 400)
    // Hela is not enrolled in formation 5: she sees the syllabus but not the files
    const hela = (await call('GET', '/api/formations/5/resources', { as: 'hela' })).data.resources
    assert.equal(hela[0].url, null)
    assert.equal((await call('POST', `/api/formation-resources/${res.id}/complete`, { as: 'hela', body: { done: true } })).status, 403)

    // assign it to Amine; finishing the only item completes the formation
    assert.equal((await call('POST', '/api/formations/5/assign', { as: 'manager', body: { userId: 7 } })).status, 201)
    const done = await call('POST', `/api/formation-resources/${res.id}/complete`, { as: 'amine', body: { done: true } })
    assert.equal(done.data.progress, 100)
    assert.equal((await call('POST', `/api/formation-resources/${res.id}/complete`, { as: 'amine', body: { done: false } })).data.progress, 0)

    const blocked = new FormData()
    blocked.append('files', new Blob(['<script>'], { type: 'text/html' }), 'x.html')
    assert.equal((await call('POST', '/api/formations/5/resources', { as: 'manager', form: blocked })).status, 400)

    // learners hear about new content
    assert.equal((await call('POST', '/api/formations/5/resources/link', { as: 'manager', body: { title: 'Reading list', url: 'https://example.com/reading' } })).status, 201)
    assert.equal((await call('GET', '/api/notifications', { as: 'amine' })).data.notifications[0].title, 'New content in “Leadership for Tech Leads”')

    assert.equal((await call('PATCH', `/api/formation-resources/${res.id}`, { as: 'manager', body: { title: 'Lab summary' } })).status, 200)
    assert.equal((await call('DELETE', `/api/formation-resources/${res.id}`, { as: 'manager' })).status, 200)
    await new Promise((r) => setTimeout(r, 50))
    assert.equal(fs.readdirSync(path.join(process.env.UPLOAD_DIR, 'formations', '5')).length, 0)
  })
})

describe('chat', () => {
  test('contacts are accounts: employees see managers, HR and teammates; staff see everyone', async () => {
    const amine = (await call('GET', '/api/contacts', { as: 'amine' })).data.contacts.map((c) => c.id)
    assert.ok([2, 3, 11, 13].every((id) => amine.includes(id))) // HR, the manager, teammates
    assert.ok(!amine.includes(15) && !amine.includes(7)) // another team's employee, and himself
    assert.equal((await call('GET', '/api/contacts', { as: 'manager' })).data.contacts.length, 15) // everyone else
  })

  test('messages reach the other person, and both sides can answer', async () => {
    const sent = await call('POST', '/api/chat-messages', { as: 'amine', body: { contactId: 11, text: 'Thursday 10:00?' } })
    assert.equal(sent.status, 201)
    assert.equal(sent.data.sender, 'me')
    assert.equal((await call('GET', '/api/chat-messages', { as: 'amine' })).data.messages[11].at(-1).text, 'Thursday 10:00?')
    // Yassine sees it under Amine's account id, with a notification that opens that chat
    const theirs = (await call('GET', '/api/chat-messages', { as: 'yassine' })).data.messages
    assert.deepEqual(theirs[7].at(-1), { ...theirs[7].at(-1), text: 'Thursday 10:00?', sender: 'contact' })
    const note = (await call('GET', '/api/notifications', { as: 'yassine' })).data.notifications.find((n) => n.type === 'message')
    assert.equal(note.contactId, 7)
    await call('PUT', '/api/chat-messages/7/read', { as: 'yassine' })
    assert.equal((await call('GET', '/api/notifications', { as: 'yassine' })).data.notifications.find((n) => n.id === note.id).isRead, true)
    // a manager who isn't in any team writes to an employee, and the employee answers
    assert.equal((await call('POST', '/api/chat-messages', { as: 'manager', body: { contactId: 12, text: 'How is the churn model?' } })).status, 201)
    assert.equal((await call('POST', '/api/chat-messages', { as: 'hela', body: { contactId: 3, text: 'Almost done!' } })).status, 201)
    assert.equal((await call('GET', '/api/chat-messages', { as: 'manager' })).data.messages[12].at(-1).text, 'Almost done!')
  })

  test('employees can message managers, HR and teammates only', async () => {
    assert.equal((await call('POST', '/api/chat-messages', { as: 'amine', body: { contactId: 15, text: 'hi' } })).status, 403) // other team
    assert.equal((await call('POST', '/api/chat-messages', { as: 'amine', body: { contactId: 7, text: 'me' } })).status, 400)
    assert.equal((await call('POST', '/api/chat-messages', { as: 'amine', body: { contactId: 99999, text: '?' } })).status, 404)
    assert.equal((await call('POST', '/api/chat-messages', { as: 'hr', body: { contactId: 15, text: 'Hello Firas' } })).status, 201)
  })
})

describe('live notifications', () => {
  test('the stream pushes an event as soon as something happens', async () => {
    assert.equal((await fetch(`${base}/api/notifications/stream?token=forged`)).status, 401)
    const ctrl = new AbortController()
    const res = await fetch(`${base}/api/notifications/stream?token=${tokens.amine}`, { signal: ctrl.signal })
    assert.match(res.headers.get('content-type'), /^text\/event-stream/)
    const reader = res.body.getReader()
    let seen = ''
    const got = (async () => {
      while (!seen.includes('event: notification')) seen += new TextDecoder().decode((await reader.read()).value)
    })()
    await call('POST', '/api/chat-messages', { as: 'manager', body: { contactId: 7, text: 'ping' } })
    await Promise.race([got, new Promise((_, no) => setTimeout(() => no(new Error('no event within 3 s')), 3000))])
    ctrl.abort()
  })
})

describe('cv coach', () => {
  const CV = `Amine Trabelsi
amine@example.com · +216 20 000 000
Cloud Engineer
Summary
Cloud engineer with 4 years of experience automating infrastructure for product teams.
Experience
Cloud Engineer — Acme Cloud (Jan 2022 – Present)
- Migrated 40 services to Kubernetes on AWS, cutting deploy time by 60%
- Built CI/CD pipelines with GitHub Actions and Docker
Junior DevOps — StartUp (2020 - 2021)
- Automated Linux servers with Ansible and Bash scripts
Education
Engineering degree — TEK-UP (2016 - 2020)
Skills
AWS, Docker, Kubernetes, Linux, Python, Git
Certifications
AWS Solutions Architect – Associate`
  const form = (content, name, type) => { const fd = new FormData(); fd.append('cv', new Blob([content], { type }), name); return fd }
  /** A minimal one-page PDF with the given lines of text. */
  function pdf(lines) {
    const esc = (s) => s.replace(/[()\\]/g, '\\$&')
    const content = `BT /F1 11 Tf 72 740 Td ${lines.map((l, i) => `${i ? '0 -15 Td ' : ''}(${esc(l)}) Tj`).join(' ')} ET`
    const objs = ['<</Type/Catalog/Pages 2 0 R>>', '<</Type/Pages/Kids[3 0 R]/Count 1>>', '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
      `<</Length ${content.length}>>\nstream\n${content}\nendstream`, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>']
    let out = '%PDF-1.4\n'
    const at = objs.map((o, i) => { const pos = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return pos })
    const xref = out.length
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${at.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`
    return Buffer.from(out, 'latin1')
  }

  test('a CV becomes skills, experience, a score and recommendations from the real catalog and teams', async () => {
    const r = await call('POST', '/api/cv/analyze', { as: 'amine', form: form(CV, 'amine-cv.txt', 'text/plain') })
    assert.equal(r.status, 200, r.data.message)
    const a = r.data.analysis
    assert.equal(a.title, 'Cloud Engineer')
    assert.equal(a.years, 4)
    assert.equal(a.seniority, 'Mid-level')
    assert.equal(a.nextRole, 'Senior Cloud Engineer')
    for (const s of ['Kubernetes', 'AWS', 'Docker', 'CI/CD']) assert.ok(a.skills.some((x) => x.name === s), s)
    assert.ok(a.strength.score > 50 && a.strength.score <= 100)
    assert.ok(a.gaps.length > 0 && a.gaps.every((g) => !a.skills.some((s) => s.name === g.name)))
    assert.ok(a.formations.length > 0 && a.formations.every((f) => f.match > 0 && f.reasons.length > 0))
    const catalog = (await call('GET', '/api/formations', { as: 'amine' })).data.formations.map((f) => f.id)
    assert.ok(a.formations.every((f) => catalog.includes(f.id)))
    assert.ok(a.manager && a.manager.reasons.length > 0)
    assert.equal(a.fileName, 'amine-cv.txt')
    assert.deepEqual((await call('GET', '/api/cv/analysis', { as: 'amine' })).data.analysis.title, 'Cloud Engineer')
    assert.equal((await call('GET', '/api/cv/analysis', { as: 'nour' })).data.analysis, null) // results are private
  })

  test('PDFs are read; wrong or empty files are refused; the result can be removed', async () => {
    const lines = ['Nour Gharbi - Data Analyst', 'Experience', 'Data Analyst at Retail Co (2021 - Present)', 'Built Power BI dashboards and SQL reports for 12 teams',
      'Automated weekly KPIs with Python and pandas', 'Skills', 'SQL, Python, Power BI, Excel, Git', 'Education', 'Master in Statistics (2016 - 2021)']
    const r = await call('POST', '/api/cv/analyze', { as: 'nour', form: form(pdf(lines), 'nour.pdf', 'application/pdf') })
    assert.equal(r.status, 200, r.data.message)
    assert.equal(r.data.analysis.title, 'Data Analyst')
    assert.ok(['SQL', 'Python', 'Data analysis'].every((s) => r.data.analysis.skills.some((x) => x.name === s)))
    assert.equal((await call('POST', '/api/cv/analyze', { as: 'nour', form: form('MZ', 'cv.exe', 'application/octet-stream') })).status, 400)
    assert.equal((await call('POST', '/api/cv/analyze', { as: 'nour', form: form('Hello world', 'cv.txt', 'text/plain') })).status, 422)
    assert.equal((await call('POST', '/api/cv/analyze', { as: 'nour' })).status, 400)
    assert.equal((await call('DELETE', '/api/cv/analysis', { as: 'nour' })).status, 200)
    assert.equal((await call('GET', '/api/cv/analysis', { as: 'nour' })).data.analysis, null)
  })
})

describe('social', () => {
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const idOf = async (who) => (await call('GET', '/api/auth/me', { as: who })).data.user.id
  const notes = async (who) => (await call('GET', '/api/notifications', { as: who })).data.notifications

  test('posts: text or an image; the image must be real; the feed shows you and the people you follow', async () => {
    assert.equal((await call('POST', '/api/posts', { as: 'amine', body: { body: '   ' } })).status, 400)
    assert.equal((await call('POST', '/api/posts', { as: 'amine', body: { image: 'data:image/png;base64,aGVsbG8=' } })).status, 400) // "hello", not a PNG
    const text = await call('POST', '/api/posts', { as: 'amine', body: { body: 'Passed the CKA today!' } })
    assert.equal(text.status, 201)
    const pic = await call('POST', '/api/posts', { as: 'amine', body: { body: 'Our new lab', image: PNG } })
    const image = pic.data.posts[0].image
    assert.match(image, /^\/uploads\/posts\/[0-9a-f]{32}\.png$/)
    assert.ok(fs.existsSync(path.join(process.env.UPLOAD_DIR, image.replace('/uploads/', ''))))
    const amineId = await idOf('amine')
    assert.equal(pic.data.people[amineId].name.startsWith('Amine'), true)

    const mine = (await call('GET', '/api/feed', { as: 'amine' })).data.posts.map((p) => p.body)
    assert.deepEqual(mine.slice(0, 2), ['Our new lab', 'Passed the CKA today!'])
    assert.equal((await call('GET', '/api/feed', { as: 'nour' })).data.posts.some((p) => p.authorId === amineId), false)

    assert.equal((await call('POST', `/api/profiles/${amineId}/follow`, { as: 'nour' })).status, 200)
    assert.equal((await call('POST', `/api/profiles/${amineId}/follow`, { as: 'nour' })).status, 200) // idempotent
    assert.equal((await call('POST', `/api/profiles/${amineId}/follow`, { as: 'amine' })).status, 400) // not yourself
    assert.equal((await notes('amine')).filter((n) => /started following you/.test(n.title)).length, 1)
    assert.equal((await call('GET', '/api/feed', { as: 'nour' })).data.posts.filter((p) => p.authorId === amineId).length, 2)
    await call('POST', '/api/posts', { as: 'amine', body: { body: 'Hello followers' } })
    assert.ok((await notes('nour')).some((n) => n.title.endsWith('shared a post') && n.body === 'Hello followers'))
  })

  test('likes and comments notify the author; only the right people delete', async () => {
    const amineId = await idOf('amine')
    const post = (await call('POST', '/api/posts', { as: 'amine', body: { body: 'Rate my dashboard', image: PNG } })).data.posts[0]
    const like = await call('POST', `/api/posts/${post.id}/like`, { as: 'yassine' })
    assert.deepEqual(like.data, { liked: true, likes: 1 })
    assert.deepEqual((await call('POST', `/api/posts/${post.id}/like`, { as: 'yassine' })).data, { liked: true, likes: 1 })
    assert.deepEqual((await call('DELETE', `/api/posts/${post.id}/like`, { as: 'yassine' })).data, { liked: false, likes: 0 })
    assert.ok((await notes('amine')).some((n) => /liked your post/.test(n.title) && n.link === `/u/${amineId}`))

    assert.equal((await call('POST', `/api/posts/${post.id}/comments`, { as: 'yassine', body: { body: '' } })).status, 400)
    const c = (await call('POST', `/api/posts/${post.id}/comments`, { as: 'yassine', body: { body: 'Looks great' } })).data.comment
    assert.equal(c.body, 'Looks great')
    assert.equal(c.canDelete, true)
    const list = (await call('GET', `/api/posts/${post.id}/comments`, { as: 'nour' })).data.comments
    assert.equal(list.length, 1)
    assert.equal(list[0].canDelete, false)
    assert.ok((await notes('amine')).some((n) => /commented on your post/.test(n.title)))
    assert.equal((await call('DELETE', `/api/comments/${c.id}`, { as: 'nour' })).status, 403)
    assert.equal((await call('DELETE', `/api/comments/${c.id}`, { as: 'amine' })).status, 200) // the post's author may

    assert.equal((await call('DELETE', `/api/posts/${post.id}`, { as: 'nour' })).status, 403)
    assert.equal((await call('DELETE', `/api/posts/${post.id}`, { as: 'hr' })).status, 200) // staff moderate
    assert.equal((await call('DELETE', `/api/posts/${post.id}`, { as: 'hr' })).status, 404)
    await new Promise((r) => setTimeout(r, 50))
    assert.equal(fs.existsSync(path.join(process.env.UPLOAD_DIR, post.image.replace('/uploads/', ''))), false)
  })

  test('profiles show identity, skills, counts and follow state; the network suggests people', async () => {
    const amineId = await idOf('amine')
    const p = (await call('GET', `/api/profiles/${amineId}`, { as: 'nour' })).data.profile
    assert.equal(p.isFollowing, true)
    assert.equal(p.isMe, false)
    assert.ok(p.followers >= 1 && p.posts >= 3)
    assert.ok(Array.isArray(p.skills) && Array.isArray(p.certificates))
    assert.equal((await call('GET', `/api/profiles/${amineId}`, { as: 'amine' })).data.profile.isMe, true)
    assert.equal((await call('GET', '/api/profiles/99999', { as: 'amine' })).status, 404)
    const posts = (await call('GET', `/api/profiles/${amineId}/posts`, { as: 'hela' })).data
    assert.ok(posts.posts.every((x) => x.authorId === amineId))

    const net = (await call('GET', '/api/network', { as: 'nour' })).data
    assert.ok(net.following.some((u) => u.id === amineId))
    const nourId = await idOf('nour')
    assert.equal(net.suggestions.some((u) => u.id === amineId || u.id === nourId), false)
    assert.ok((await call('GET', '/api/network', { as: 'amine' })).data.followers.some((u) => u.id === nourId))
    await call('DELETE', `/api/profiles/${amineId}/follow`, { as: 'nour' })
    assert.equal((await call('GET', `/api/profiles/${amineId}`, { as: 'nour' })).data.profile.isFollowing, false)
  })
})

describe('teams', () => {
  test('employees see their team; others’ ratings stay private', async () => {
    const teams = (await call('GET', '/api/teams', { as: 'amine' })).data.teams
    assert.deepEqual(teams.map((t) => t.name), ['Infra Squad'])
    const members = teams[0].employees
    assert.equal(members.find((m) => m.userId === 7).rating, 4.4)
    assert.equal(members.find((m) => m.userId === 11).rating, null)
    assert.equal(members.find((m) => m.userId === 7).status, 'online')
    assert.equal((await call('GET', '/api/teams', { as: 'hr' })).data.teams.length, 3)
  })

  test('staff build teams and give feedback', async () => {
    const team = await call('POST', '/api/teams', { as: 'manager', body: { name: 'SRE Guild', managerName: 'Sarra Ben Youssef', managerRole: 'Engineering Manager' } })
    assert.equal(team.status, 201)
    assert.equal(team.data.employees.length, 0)
    const member = await call('POST', `/api/teams/${team.data.id}/members`, { as: 'manager', body: { userId: 13, skills: ['Linux'] } })
    assert.equal(member.status, 201)
    assert.equal(member.data.name, 'Nour Gharbi')
    assert.equal((await call('POST', `/api/teams/${team.data.id}/members`, { as: 'manager', body: { userId: 13 } })).status, 409)
    assert.equal((await call('POST', `/api/teams/${team.data.id}/members`, { as: 'manager', body: { name: 'Guest Speaker', role: 'Consultant' } })).status, 201)
    const fb = await call('PUT', `/api/teams/members/${member.data.id}/feedback`, { as: 'manager', body: { rating: 4.5, feedback: 'Great on-call' } })
    assert.deepEqual(fb.data, { id: member.data.id, rating: 4.5, feedback: 'Great on-call' })
    assert.equal((await call('PUT', `/api/teams/members/${member.data.id}/feedback`, { as: 'amine', body: { rating: 1 } })).status, 403)
  })
})

describe('profile, skills, certificates, employees', () => {
  test('partial profile updates keep the other columns', async () => {
    const r = await call('PUT', '/api/users/7', { as: 'amine', body: { bio: 'Updated bio' } })
    assert.equal(r.data.user.bio, 'Updated bio')
    assert.equal(r.data.user.position, 'Cloud Engineer II')
    assert.equal((await call('PUT', '/api/users/11', { as: 'amine', body: { bio: 'x' } })).status, 403)
    assert.equal((await call('PUT', '/api/users/7', { as: 'amine', body: { profilePhoto: 'javascript:alert(1)' } })).status, 400)
    assert.equal((await call('PUT', '/api/users/7', { as: 'amine', body: { profilePhoto: 'data:image/png;base64,iVBORw0KGgo=' } })).status, 200)
  })

  test('skills and certificates belong to their owner', async () => {
    const s = await call('POST', '/api/skills', { as: 'amine', body: { skillName: 'Rust' } })
    assert.equal(s.status, 201)
    assert.equal((await call('POST', '/api/skills', { as: 'amine', body: { skillName: 'rust' } })).status, 409)
    assert.equal((await call('DELETE', `/api/skills/${s.data.id}`, { as: 'nour' })).status, 404)
    assert.equal((await call('DELETE', `/api/skills/${s.data.id}`, { as: 'amine' })).status, 200)
    const c = await call('POST', '/api/certificates', { as: 'amine', body: { certificateName: 'CKA' } })
    assert.ok((await call('GET', '/api/certificates/7', { as: 'hr' })).data.certificates.some((x) => x.id === c.data.id))
  })

  test('the employee directory is staff-only', async () => {
    assert.equal((await call('GET', '/api/employees', { as: 'amine' })).status, 403)
    const list = (await call('GET', '/api/employees', { as: 'hr' })).data.employees
    assert.ok(list.some((e) => e.name === 'Amine Trabelsi' && e.currentPosition === 'Cloud Engineer II'))
  })

  test('unknown routes answer 404 as JSON', async () => {
    const r = await call('GET', '/api/nope', { as: 'amine' })
    assert.equal(r.status, 404)
    assert.match(r.data.message, /Route not found/)
  })
})
