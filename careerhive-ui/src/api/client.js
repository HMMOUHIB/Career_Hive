/**
 * CareerHive API client — mirrors server.js route for route.
 *
 * - VITE_API_URL set  -> talks to your Express backend (JWT in Authorization header).
 * - VITE_API_URL empty -> runs against the in-browser demo server (src/api/demo.js).
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const DEMO = !BASE
// the demo server and its mock data load only in demo builds; the real app never downloads them
const demo = () => import('./demo')

const TOKEN_KEY = 'ch_token'
export const auth = {
  get token() { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set token(v) { try { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage blocked */ } },
}

const AUTH_ERRORS = {
  verify_invalid: 'That confirmation link is not valid. Sign in to get a new one.',
  verify_expired: 'That confirmation link has expired or was replaced by a newer one. Sign in to get a new one.',
  not_configured: 'This sign-in option is not set up on the server yet.',
}

/**
 * Social sign-in and the email confirmation link both land on FRONTEND_URL/oauth-success?token=… — grab it once.
 * Failures land on /auth?error=… (or ?notice=verified for an already-confirmed link): returns { error } or { notice }.
 */
export function captureOAuthToken() {
  const url = new URL(window.location.href)
  const t = url.searchParams.get('token')
  if (t) {
    auth.token = t
    url.searchParams.delete('token')
    window.history.replaceState({}, '', url.pathname === '/oauth-success' ? '/' : url.pathname + url.search + url.hash)
  }
  if (url.pathname !== '/auth') return null
  window.history.replaceState({}, '', '/')
  if (url.searchParams.get('notice') === 'verified') return { notice: 'Your email is confirmed. Sign in to continue.' }
  return { error: AUTH_ERRORS[url.searchParams.get('error')] ?? 'Social sign-in failed. Please try again.' }
}

/**
 * Render's free plan stops the API after 15 idle minutes and takes ~30–60 s to start it again; a browser sent straight
 * to it meanwhile gets Render's "waking up" page. wake() polls /api/health until Express answers, and fails with the
 * API's message when the database behind it is down. One shared attempt: requests and social sign-in wait on it.
 */
let waking = null
let awake = DEMO
export const apiAwake = () => awake
export function wake() {
  if (DEMO) return Promise.resolve()
  waking ??= (async () => {
    for (const until = Date.now() + 120_000; Date.now() < until;) {
      let res = null
      try { res = await fetch(`${BASE}/api/health`, { cache: 'no-store' }) } catch { /* still starting: Render's holding page carries no CORS headers */ }
      if (res?.headers.get('content-type')?.includes('json')) { // Express answered
        if (res.ok) { awake = true; return }
        waking = null
        throw new Error((await res.json().catch(() => ({}))).message ?? 'The server is not ready yet. Please try again in a minute.')
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    waking = null
    throw new Error('The server is taking too long to start. Please try again in a minute.')
  })()
  return waking
}
if (!DEMO) wake().catch(() => {}) // start it the moment the app opens, while the person is still typing

async function request(method, path, body) {
  if (DEMO) return (await demo()).demoRequest(method, path, body)
  await wake()
  const send = () => fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  // a request that never reached the API fails as a network error: it may have gone back to sleep, so wait and retry once
  const res = await send().catch(() => { awake = false; waking = null; return wake().then(send) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = new Error(data.message ?? res.statusText)
    e.status = res.status
    e.code = data.code // e.g. EMAIL_NOT_VERIFIED
    throw e
  }
  return data
}

const get = (p) => request('GET', p)
const post = (p, b) => request('POST', p, b)
const put = (p, b) => request('PUT', p, b)
const del = (p) => request('DELETE', p)

export const api = {
  // auth
  login: (email, password) => post('/api/auth/login', { email, password }),
  signup: (name, email, password, role) => post('/api/auth/signup', { name, email, password, role }), // → { verificationRequired, email } or { token, user }
  resendVerification: (email) => post('/api/auth/resend-verification', { email }),
  forgotPassword: (email) => post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => post('/api/auth/reset-password', { token, password }),
  me: () => get('/api/auth/me').then((r) => r.user),
  oauthUrl: (provider) => (DEMO ? null : `${BASE}/api/auth/${provider}`), // google | linkedin | github
  logout: () => { auth.token = null; if (DEMO) demo().then((d) => d.demoLogout()) },

  dashboard: () => get('/api/dashboard'),

  // profile — PUT overwrites every column, so always send the full user
  updateProfile: (user) => put(`/api/users/${user.id}`, user).then((r) => r.user),

  skills: (userId) => get(`/api/skills/${userId}`).then((r) => r.skills),
  addSkill: (skillName) => post('/api/skills', { skillName }),
  deleteSkill: (id) => del(`/api/skills/${id}`),

  certificates: (userId) => get(`/api/certificates/${userId}`).then((r) => r.certificates),
  addCertificate: (certificateName) => post('/api/certificates', { certificateName }),
  deleteCertificate: (id) => del(`/api/certificates/${id}`),

  // teams
  teams: () => get('/api/teams').then((r) => r.teams),
  createTeam: (t) => post('/api/teams', t),
  addMember: (teamId, m) => post(`/api/teams/${teamId}/members`, m),
  memberFeedback: (memberId, rating, feedback) => put(`/api/teams/members/${memberId}/feedback`, { rating, feedback }),

  // communications hub — contacts are accounts: staff see everyone, employees see managers, HR and teammates
  contacts: () => get('/api/contacts').then((r) => r.contacts),
  chat: () => get('/api/chat-messages').then((r) => r.messages),
  /** Live notifications (Server-Sent Events); EventSource can't send headers, so the token goes in the URL. */
  streamUrl: () => (DEMO || !auth.token ? null : `${BASE}/api/notifications/stream?token=${encodeURIComponent(auth.token)}`),
  sendChat: (contactId, text) => post('/api/chat-messages', { contactId, text }),

  employees: () => get('/api/employees').then((r) => r.employees),

  // People & roles (workspace owner only): everyone signs up as an employee; the owner picks managers and HR
  people: () => get('/api/people').then((r) => r.people),
  setRole: (userId, role) => put(`/api/people/${userId}/role`, { role }),
  deletePerson: (userId) => del(`/api/people/${userId}`),

  // promotions (HR reviews first -> 'on-hold' -> manager final approve)
  promotions: () => get('/api/promotion-requests').then((r) => r.requests),
  requestPromotion: (p) => post('/api/promotion-requests', p),
  hrReview: (id, comments) => put(`/api/promotion-requests/${id}/hr-review`, { comments }),
  managerApprove: (id, p) => put(`/api/promotion-requests/${id}/manager-final-approve`, p),
  rejectPromotion: (id, comments) => put(`/api/promotion-requests/${id}/reject`, { comments }),

  // notifications (optional backend module — see backend-additions/). null = not installed.
  notifications: () => get('/api/notifications').catch((e) => { if (e.status === 404) return null; throw e }),
  readNotification: (id) => put(`/api/notifications/${id}/read`),
  readAllNotifications: () => put('/api/notifications/read-all'),
  markChatRead: (contactId) => put(`/api/chat-messages/${contactId}/read`).catch(() => null),

  // course content (optional backend module formation-content.js)
  resources: (fid) => get(`/api/formations/${fid}/resources`).then((r) => r.resources),
  uploadResources: (fid, files, onProgress) => (DEMO ? demo().then((d) => d.demoUpload(fid, files, onProgress)) : xhrUpload(`/api/formations/${fid}/resources`, files, onProgress)),
  addResourceLink: (fid, title, url) => post(`/api/formations/${fid}/resources/link`, { title, url }).then((r) => r.resource),
  updateResource: (rid, patch) => request('PATCH', `/api/formation-resources/${rid}`, patch),
  deleteResource: (rid) => del(`/api/formation-resources/${rid}`),
  completeResource: (rid, done) => post(`/api/formation-resources/${rid}/complete`, { done }),

  // formations
  formations: () => get('/api/formations').then((r) => r.formations),
  createFormation: (f) => post('/api/formations', f),
  assignFormation: (formationId, userId) => post(`/api/formations/${formationId}/assign`, { userId }),
  deleteFormation: (formationId) => del(`/api/formations/${formationId}`),
  myFormations: () => get('/api/my-formations').then((r) => r.formations),
  setProgress: (id, progress) => put(`/api/my-formations/${id}/progress`, { progress }),
  requestFormation: (formationId, motivation) => post('/api/formation-requests', { formationId, motivation }),
  formationRequests: () => get('/api/formation-requests').then((r) => r.requests),
  formationHrReview: (id) => put(`/api/formation-requests/${id}/hr-review`),
  formationManagerConfirm: (id) => put(`/api/formation-requests/${id}/manager-confirm`),
  rejectFormation: (id) => put(`/api/formation-requests/${id}/reject`),

  // social: lists come back as { posts, people, more } — posts carry authorId, `people` has each author once
  feed: (before) => get(`/api/feed${before ? `?before=${before}` : ''}`),
  profile: (userId) => get(`/api/profiles/${userId}`),
  profilePosts: (userId, before) => get(`/api/profiles/${userId}/posts${before ? `?before=${before}` : ''}`),
  follow: (userId) => post(`/api/profiles/${userId}/follow`),
  unfollow: (userId) => del(`/api/profiles/${userId}/follow`),
  network: () => get('/api/network'),
  createPost: (p) => post('/api/posts', p), // { body?, image? (data: URL) }
  deletePost: (postId) => del(`/api/posts/${postId}`),
  like: (postId) => post(`/api/posts/${postId}/like`),
  unlike: (postId) => del(`/api/posts/${postId}/like`),
  comments: (postId) => get(`/api/posts/${postId}/comments`),
  addComment: (postId, body) => post(`/api/posts/${postId}/comments`, { body }),
  deleteComment: (commentId) => del(`/api/comments/${commentId}`),

  // CV coach: upload a CV → skills, experience, score, gaps, best formations and manager (the file isn't stored)
  cvAnalysis: () => get('/api/cv/analysis'),
  deleteCvAnalysis: () => del('/api/cv/analysis'),
  analyzeCv: (file, onProgress) => (DEMO ? demo().then((d) => d.demoAnalyzeCv(file)) : xhrForm('/api/cv/analyze', 'cv', file, onProgress).then((d) => d.analysis)),
}

/** One-file multipart POST with upload progress; resolves with the JSON body. */
function xhrForm(path, field, file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append(field, file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', BASE + path)
    if (auth.token) xhr.setRequestHeader('Authorization', `Bearer ${auth.token}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      let data = {}
      try { data = JSON.parse(xhr.responseText) } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else { const e = new Error(data.message ?? `Upload failed (${xhr.status})`); e.status = xhr.status; reject(e) }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(fd)
  })
}

/** Absolute URL for an uploaded file ("/uploads/…" lives on the API host). */
export const fileUrl = (url) => (url && url.startsWith('/uploads/') ? BASE + url : url)

/** Multipart upload with progress (fetch can't report upload progress). */
function xhrUpload(path, files, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    ;[...files].forEach((f) => fd.append('files', f))
    const xhr = new XMLHttpRequest()
    xhr.open('POST', BASE + path)
    if (auth.token) xhr.setRequestHeader('Authorization', `Bearer ${auth.token}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => {
      let data = {}
      try { data = JSON.parse(xhr.responseText) } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data.resources ?? [])
      else { const e = new Error(data.message ?? `Upload failed (${xhr.status})`); e.status = xhr.status; reject(e) }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(fd)
  })
}

/** Resize an image file to a compact base64 JPEG (the API caps JSON bodies at 10 MB). */
export function imageToBase64(file, max = 640, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
