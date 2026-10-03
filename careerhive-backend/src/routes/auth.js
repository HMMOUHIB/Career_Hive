import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { requireAuth, signToken } from '../auth.js'
import { config } from '../config.js'
import { one, q } from '../db.js'
import { fail, text } from '../http.js'
import { resetEmail, sendMail, verificationEmail } from '../mail.js'
import { notify } from '../notify.js'
import { USER_COLUMNS, userOut } from '../mappers.js'

const router = Router()
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: Number(process.env.AUTH_RATE_LIMIT) || 30, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
})
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STAFF_ROLES = ['manager', 'hr', 'admin']
const loadUser = (id) => one(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id])
const emailOf = (body) => String(body.email ?? '').trim().toLowerCase()

/** Tell managers, HR and admins that someone joined (the owner's notification opens People & roles). */
async function announceNewAccount(user, method) {
  const staff = await q("SELECT id, email FROM users WHERE role IN ('manager', 'hr', 'admin') AND id <> ?", [user.id])
  const name = `${user.first_name} ${user.last_name ?? ''}`.trim() || user.email
  const n = { type: 'info', title: `New account: ${name}`, body: `${user.email} joined with ${method}. They start as an employee.` }
  await notify(staff.filter((s) => config.staffEmails.includes(s.email)).map((s) => s.id), { ...n, link: '/people' })
  await notify(staff.filter((s) => !config.staffEmails.includes(s.email)).map((s) => s.id), { ...n, link: '/' })
}

/** The workspace owners (STAFF_EMAILS) are managers: an owner account still marked as employee is promoted. */
async function ensureOwnerRole(user) {
  if (config.staffEmails.includes(user.email) && user.role === 'student') await q("UPDATE users SET role = 'manager' WHERE id = ?", [user.id])
}

/* ---------- single-use email links (confirm email, reset password) ---------- */

const TOKEN_MINUTES = { verify_email: 24 * 60, reset_password: 60 }
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

async function issueToken(userId, purpose) {
  // only the newest link of each kind works
  await q('UPDATE auth_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND purpose = ? AND used_at IS NULL', [userId, purpose])
  const token = crypto.randomBytes(32).toString('base64url')
  await q('INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at) VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? MINUTE)',
    [userId, purpose, sha256(token), TOKEN_MINUTES[purpose]])
  return token
}

/** The token row (with `valid` = unused and unexpired), or null. */
function findToken(token, purpose) {
  if (typeof token !== 'string' || !token || token.length > 100) return null
  return one(`SELECT t.id, t.user_id, t.used_at IS NULL AND t.expires_at > UTC_TIMESTAMP() AS valid, u.email, u.role, u.email_verified_at,
    u.first_name, u.last_name
    FROM auth_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ? AND t.purpose = ?`, [sha256(token), purpose])
}

/** Email a confirmation link; resolves to false if the mail server refused it. */
async function sendVerification(user) {
  const token = await issueToken(user.id, 'verify_email')
  const url = `${config.apiUrl}/api/auth/verify-email?token=${token}`
  return sendMail({ to: user.email, ...verificationEmail(user.first_name, url) }).then(() => true, (e) => {
    console.error(`[mail] could not send the confirmation email to ${user.email}:`, e.message)
    return false
  })
}

/* ---------- email + password ---------- */

router.post('/login', limiter, async (req, res) => {
  const email = emailOf(req.body)
  const password = String(req.body.password ?? '')
  if (!email || !password) fail(400, 'Email and password are required.')
  const row = await one('SELECT id, email, role, password_hash, email_verified_at FROM users WHERE email = ?', [email])
  if (row && !row.password_hash) fail(401, 'This account uses social sign-in (LinkedIn, GitHub or Google). You can also set a password with “Forgot password”.')
  if (!row || !(await bcrypt.compare(password, row.password_hash))) fail(401, 'Invalid email or password.')
  if (!row.email_verified_at && config.requireEmailVerification) {
    fail(403, `Please confirm your email first. We sent a link to ${row.email}.`, 'EMAIL_NOT_VERIFIED')
  }
  await ensureOwnerRole(row)
  res.json({ token: signToken(row), user: userOut(await loadUser(row.id)) })
})

router.post('/signup', limiter, async (req, res) => {
  const name = text(req.body.name, { field: 'Full name', max: 200, required: true })
  const email = emailOf(req.body)
  const password = String(req.body.password ?? '')
  if (!EMAIL.test(email) || email.length > 255) fail(400, 'A valid email is required.')
  if (password.length < 8) fail(400, 'Password must be at least 8 characters.')
  let role = req.body.role || 'student'
  if (!['student', ...STAFF_ROLES].includes(role)) fail(400, 'Unknown role.')
  if (config.staffEmails.includes(email)) {
    if (!STAFF_ROLES.includes(role)) role = 'manager' // the owner is a manager unless they pick HR or admin
  } else if (!config.signupRoles.includes(role)) {
    fail(403, 'Only the workspace owner can create manager or HR accounts. Please sign up as an employee.')
  }
  if (await one('SELECT id FROM users WHERE email = ?', [email])) {
    fail(409, 'An account with this email already exists. Sign in, or use “Forgot password”.')
  }
  const [firstName, ...rest] = name.split(/\s+/)
  const verifiedAt = config.requireEmailVerification ? null : new Date()
  const { insertId } = await q('INSERT INTO users (first_name, last_name, email, email_verified_at, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
    [firstName.slice(0, 100), rest.join(' ').slice(0, 100), email, verifiedAt, await bcrypt.hash(password, 10), role])
  if (!config.requireEmailVerification) {
    await announceNewAccount({ id: insertId, first_name: firstName, last_name: rest.join(' '), email }, 'email')
    return res.status(201).json({ token: signToken({ id: insertId }), user: userOut(await loadUser(insertId)) })
  }

  const emailSent = await sendVerification({ id: insertId, email, first_name: firstName })
  res.status(201).json({
    verificationRequired: true, email, emailSent,
    message: emailSent ? `We sent a confirmation link to ${email}.` : 'Your account is created, but the email could not be sent. Try “Resend the link” in a minute.',
  })
})

// The link in the confirmation email: confirms the address, then signs the person in.
router.get('/verify-email', async (req, res) => {
  const t = await findToken(req.query.token, 'verify_email')
  if (!t) return res.redirect(`${config.frontendUrl}/auth?error=verify_invalid`)
  if (!t.valid) return res.redirect(`${config.frontendUrl}/auth?${t.email_verified_at ? 'notice=verified' : 'error=verify_expired'}`)
  await q('UPDATE users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()) WHERE id = ?', [t.user_id])
  await q('UPDATE auth_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?', [t.id])
  await ensureOwnerRole(t)
  if (!t.email_verified_at) await announceNewAccount({ ...t, id: t.user_id }, 'email') // first confirmation = a new account
  res.redirect(`${config.frontendUrl}/oauth-success?token=${encodeURIComponent(signToken({ id: t.user_id }))}`)
})

// Same answer whether or not the account exists, so this can't be used to probe for emails.
router.post('/resend-verification', limiter, async (req, res) => {
  const user = await one('SELECT id, email, first_name, email_verified_at FROM users WHERE email = ?', [emailOf(req.body)])
  if (user && !user.email_verified_at) await sendVerification(user)
  res.json({ message: 'If that account still needs confirming, a new link is on its way.' })
})

router.post('/forgot-password', limiter, async (req, res) => {
  const user = await one('SELECT id, email, first_name FROM users WHERE email = ?', [emailOf(req.body)])
  if (user) {
    const token = await issueToken(user.id, 'reset_password')
    await sendMail({ to: user.email, ...resetEmail(user.first_name, `${config.frontendUrl}/reset-password?reset=${token}`) })
      .catch((e) => console.error(`[mail] could not send the reset email to ${user.email}:`, e.message))
  }
  res.json({ message: 'If an account exists for that email, a reset link is on its way.' })
})

router.post('/reset-password', limiter, async (req, res) => {
  const password = String(req.body.password ?? '')
  if (password.length < 8) fail(400, 'Password must be at least 8 characters.')
  const t = await findToken(req.body.token, 'reset_password')
  if (!t?.valid) fail(400, 'This reset link is invalid or has expired. Ask for a new one.', 'RESET_TOKEN_INVALID')
  // opening the emailed link proves the inbox is theirs, so the address counts as confirmed too
  await q('UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()) WHERE id = ?', [await bcrypt.hash(password, 10), t.user_id])
  await q("UPDATE auth_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND purpose = 'reset_password' AND used_at IS NULL", [t.user_id])
  await ensureOwnerRole(t)
  res.json({ token: signToken({ id: t.user_id }), user: userOut(await loadUser(t.user_id)) })
})

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: userOut(await loadUser(req.user.id)) })
})

/* ---------- social sign-in (OAuth 2.0 authorization code flow) ---------- */

async function getJson(url, token) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'careerhive-api' } })
  if (!r.ok) throw new Error(`${url} → ${r.status}`)
  return r.json()
}

const PROVIDERS = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    async profile(token) {
      const r = await getJson('https://openidconnect.googleapis.com/v1/userinfo', token)
      return { id: r.sub, email: r.email, verified: !!r.email_verified, firstName: r.given_name, lastName: r.family_name, photo: r.picture }
    },
  },
  linkedin: {
    authorize: 'https://www.linkedin.com/oauth/v2/authorization',
    token: 'https://www.linkedin.com/oauth/v2/accessToken',
    scope: 'openid profile email',
    async profile(token) {
      const r = await getJson('https://api.linkedin.com/v2/userinfo', token)
      return { id: r.sub, email: r.email, verified: r.email_verified !== false, firstName: r.given_name, lastName: r.family_name, photo: r.picture }
    },
  },
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    async profile(token) {
      const u = await getJson('https://api.github.com/user', token)
      const emails = await getJson('https://api.github.com/user/emails', token)
      const email = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified)
      const [firstName, ...rest] = (u.name || u.login).split(' ')
      return { id: String(u.id), email: email?.email, verified: !!email, firstName, lastName: rest.join(' '), photo: u.avatar_url }
    },
  },
}
const callbackUrl = (provider) => `${config.apiUrl}/api/auth/${provider}/callback`

router.get('/:provider', (req, res) => {
  const p = PROVIDERS[req.params.provider]
  if (!p) fail(404, 'Unknown sign-in provider.')
  const { clientId } = config.oauth[req.params.provider]
  if (!clientId) return res.redirect(`${config.frontendUrl}/auth?error=not_configured`)
  // the state is a short-lived signed token, so no server-side session is needed
  const state = jwt.sign({ provider: req.params.provider, nonce: crypto.randomBytes(8).toString('hex') }, config.jwtSecret, { expiresIn: '10m' })
  const url = new URL(p.authorize)
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: callbackUrl(req.params.provider), response_type: 'code', scope: p.scope, state })
  res.redirect(url.toString())
})

router.get('/:provider/callback', async (req, res) => {
  const name = req.params.provider
  const p = PROVIDERS[name]
  try {
    if (!p) throw new Error('unknown provider')
    const state = jwt.verify(String(req.query.state ?? ''), config.jwtSecret)
    if (state.provider !== name || !req.query.code) throw new Error('bad state')
    const { clientId, clientSecret } = config.oauth[name]
    const tokenRes = await fetch(p.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code: String(req.query.code), grant_type: 'authorization_code', redirect_uri: callbackUrl(name) }),
    })
    const { access_token: accessToken } = await tokenRes.json()
    if (!accessToken) throw new Error('no access token')
    const profile = await p.profile(accessToken)
    if (!profile.email || !profile.verified) throw new Error('no verified email')
    const email = profile.email.toLowerCase()

    // the provider vouches for the email, so it counts as confirmed; same email = same account
    let user = await one('SELECT id, email, role FROM users WHERE oauth_provider = ? AND oauth_id = ?', [name, profile.id])
    if (!user) {
      user = await one('SELECT id, email, role FROM users WHERE email = ?', [email])
      if (user) {
        await q(`UPDATE users SET oauth_provider = COALESCE(oauth_provider, ?), oauth_id = COALESCE(oauth_id, ?), profile_photo = COALESCE(profile_photo, ?),
          email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()) WHERE id = ?`, [name, profile.id, profile.photo ?? null, user.id])
      } else {
        const role = config.staffEmails.includes(email) ? 'manager' : 'student'
        const { insertId } = await q(`INSERT INTO users (first_name, last_name, email, email_verified_at, role, profile_photo, oauth_provider, oauth_id)
          VALUES (?, ?, ?, UTC_TIMESTAMP(), ?, ?, ?, ?)`, [profile.firstName || email.split('@')[0], profile.lastName || '', email, role, profile.photo ?? null, name, profile.id])
        user = { id: insertId, email, role }
        await announceNewAccount({ id: insertId, first_name: profile.firstName || email.split('@')[0], last_name: profile.lastName || '', email },
          { google: 'Google', linkedin: 'LinkedIn', github: 'GitHub' }[name])
      }
    }
    await ensureOwnerRole(user)
    res.redirect(`${config.frontendUrl}/oauth-success?token=${encodeURIComponent(signToken(user))}`)
  } catch (e) {
    console.warn(`[oauth:${name}] sign-in failed:`, e.message)
    res.redirect(`${config.frontendUrl}/auth`) // the UI shows "Social sign-in failed"
  }
})

export default router
