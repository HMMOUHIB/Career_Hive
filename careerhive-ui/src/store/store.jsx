import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { api, auth, captureOAuthToken, DEMO } from '../api/client'
import { fromServer } from './notifications'

/* Promotion gate — change these to match your company's policy. */
export const PROMOTION_RULES = { minCompletedFormations: 3, minCertificates: 1, minAvgProgress: 50 }

const STAFF = ['manager', 'hr', 'admin']
const Ctx = createContext(null)
const readPrefs = () => { try { return JSON.parse(localStorage.getItem('ch_chat_prefs') || '{}') } catch { return {} } }
const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d } }
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }
// The app opens in the blue Frost theme; a theme you pick is remembered (new key, so older saved picks start over on Frost).
// v5: every browser starts again in Frost (a short-lived redesign saved dark/light picks under v4), then keeps its own choice
const THEME_KEY = 'ch_theme_v5'
const readTheme = () => { try { return localStorage.getItem(THEME_KEY) === 'ember' ? 'ember' : 'frost' } catch { return 'frost' } } // two themes: Frost and Dark

const initial = {
  status: 'idle', user: null, dashboard: null,
  formations: [], myFormations: [], skills: [], certificates: [], promotions: [],
  teams: [], chat: {}, employees: [], formationRequests: [], contacts: null,
  typing: null, theme: readTheme(), toast: null, authError: null, authNotice: null,
  dock: [], minimized: {}, unread: {},
  reactions: {}, chatPrefs: readPrefs(), sending: {},
  resources: {}, contentAvailable: true,
  serverNotifs: null, notifRead: {}, notifPrefs: readJSON('ch_notif_prefs', { sound: true, desktop: false }),
}

function reducer(s, a) {
  switch (a.type) {
    case 'status': return { ...s, status: a.status }
    case 'set': return { ...s, ...a.patch }
    case 'logout': return { ...initial, theme: s.theme, status: 'idle' }
    case 'chat': {
      const seen = a.msg.sender === 'me' || (s.dock.includes(a.cid) && !s.minimized[a.cid]) || s.hubOpen === a.cid
      return { ...s, chat: { ...s.chat, [a.cid]: [...(s.chat[a.cid] ?? []), a.msg] }, unread: seen ? s.unread : { ...s.unread, [a.cid]: (s.unread[a.cid] ?? 0) + 1 } }
    }
    case 'openChat': {
      const dock = [a.cid, ...s.dock.filter((c) => c !== a.cid)].slice(0, 3)
      return { ...s, dock, minimized: { ...s.minimized, [a.cid]: false }, unread: { ...s.unread, [a.cid]: 0 } }
    }
    case 'closeChat': return { ...s, dock: s.dock.filter((c) => c !== a.cid) }
    case 'minChat': return { ...s, minimized: { ...s.minimized, [a.cid]: a.value }, unread: a.value ? s.unread : { ...s.unread, [a.cid]: 0 } }
    case 'react': {
      const cur = s.reactions[a.key]
      return { ...s, reactions: { ...s.reactions, [a.key]: cur === a.emoji ? null : a.emoji } }
    }
    case 'chatPref': {
      const chatPrefs = { ...s.chatPrefs, [a.cid]: { ...(s.chatPrefs[a.cid] ?? {}), ...a.patch } }
      try { localStorage.setItem('ch_chat_prefs', JSON.stringify(chatPrefs)) } catch { /* ignore */ }
      return { ...s, chatPrefs }
    }
    case 'chatSync': {
      // merge a fresh GET /api/chat-messages and count incoming messages we haven't seen
      const unread = { ...s.unread }
      Object.entries(a.chat).forEach(([cid, list]) => {
        const before = (s.chat[cid] ?? []).filter((m) => m.sender !== 'me').length
        const now = list.filter((m) => m.sender !== 'me').length
        const open = (s.dock.includes(cid) && !s.minimized[cid]) || s.hubOpen === cid
        if (now > before && !open) unread[cid] = (unread[cid] ?? 0) + (now - before)
      })
      return { ...s, chat: a.chat, unread }
    }
    case 'resources': return { ...s, resources: { ...s.resources, [a.fid]: a.list } }
    case 'notifRead': return { ...s, notifRead: a.value }
    case 'clearUnread': return { ...s, unread: { ...s.unread, [a.cid]: 0 } }
    case 'hubOpen': return { ...s, hubOpen: a.cid, unread: a.cid ? { ...s.unread, [a.cid]: 0 } : s.unread }
    default: return s
  }
}

const num = (d) => parseFloat(String(d ?? '').replace(',', '.')) || 0
export const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ')
export const roleLabel = { student: 'Employee', manager: 'Manager', hr: 'HR', admin: 'Admin' }
/** The theme buttons (top bar, sign-in page) cycle Frost → Dark → Light → Frost; this is the one they switch to next. */
const THEME_CYCLE = [{ id: 'frost', label: 'Frost', icon: 'Snowflake' }, { id: 'ember', label: 'Dark', icon: 'Moon' }]
export const nextTheme = (id) => THEME_CYCLE[(THEME_CYCLE.findIndex((t) => t.id === id) + 1) % THEME_CYCLE.length]

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const timers = useRef([])
  const set = (patch) => dispatch({ type: 'set', patch })

  const toast = useCallback((text, tone = 'good') => {
    const t = { text, tone, id: Date.now() }
    dispatch({ type: 'set', patch: { toast: t } })
    timers.current.push(setTimeout(() => dispatch({ type: 'set', patch: { toast: null } }), 3400))
  }, [])

  // Loaders, one per slice, so a mutation only refetches what it changed.
  const loaders = useMemo(() => ({
    dashboard: async () => ({ dashboard: await api.dashboard() }),
    formations: async () => ({ formations: await api.formations() }),
    myFormations: async () => ({ myFormations: await api.myFormations() }),
    skills: async (u) => ({ skills: await api.skills(u.id) }),
    certificates: async (u) => ({ certificates: await api.certificates(u.id) }),
    promotions: async () => ({ promotions: await api.promotions() }),
    teams: async () => ({ teams: await api.teams() }),
    chat: async () => ({ chat: await api.chat() }),
    contacts: async () => (DEMO ? {} : { contacts: await api.contacts() }), // demo mode derives them from teams
    employees: async (u) => (STAFF.includes(u.role) ? { employees: await api.employees() } : {}),
    formationRequests: async (u) => (STAFF.includes(u.role) ? { formationRequests: await api.formationRequests() } : {}),
  }), [])

  const userRef = useRef(null)
  const refresh = useCallback(async (...keys) => {
    const u = userRef.current
    if (!u) return
    const parts = await Promise.all(keys.map((k) => loaders[k](u).catch((e) => { console.warn(k, e); return {} })))
    dispatch({ type: 'set', patch: Object.assign({}, ...parts) })
  }, [loaders])

  const boot = useCallback(async () => {
    dispatch({ type: 'status', status: 'loading' })
    try {
      const user = await api.me()
      userRef.current = user
      dispatch({ type: 'set', patch: { user } })
      await refresh(...Object.keys(loaders))
      const notifRead = readJSON(`ch_notif_read_${user.id}`, null)
      const serverList = await api.notifications().catch(() => null)
      dispatch({ type: 'set', patch: { serverNotifs: serverList ? fromServer(serverList.notifications ?? serverList) : null, notifRead: notifRead ?? { __first: Date.now() } } })
      dispatch({ type: 'status', status: 'ready' })
    } catch (e) {
      auth.token = null
      userRef.current = null
      dispatch({ type: 'logout' })
      if (e.status !== 401) toast(e.message, 'bad')
    }
  }, [refresh, loaders, toast])

  useEffect(() => {
    const back = captureOAuthToken()
    if (back) dispatch({ type: 'set', patch: { authError: back.error ?? null, authNotice: back.notice ?? null } })
    if (auth.token) boot()
    const ts = timers.current
    return () => ts.forEach(clearTimeout)
  }, [boot])

  // Seed Messenger-style unread badges: a chat whose last message came from the other person is unread.
  useEffect(() => {
    if (state.status !== 'ready') return
    const seed = {}
    Object.entries(state.chat).forEach(([cid, list]) => { if (list.at(-1) && list.at(-1).sender !== 'me') seed[cid] = 1 })
    dispatch({ type: 'set', patch: { unread: { ...seed } } })
  }, [state.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live mode: the API pushes an event the moment something new arrives (messages, requests, decisions, new
  // formations…); a 20-second poll backs it up. Pushed events are fetched even in a background tab, for desktop alerts.
  useEffect(() => {
    if (state.status !== 'ready' || DEMO) return
    const tick = async (pushed) => {
      if (document.hidden && !pushed) return
      const [chat, list] = await Promise.all([api.chat().catch(() => null), api.notifications().catch(() => null)])
      if (chat) dispatch({ type: 'chatSync', chat })
      if (list) dispatch({ type: 'set', patch: { serverNotifs: fromServer(list.notifications ?? list) } })
      refresh('dashboard', 'promotions', 'myFormations', 'formationRequests', 'formations', 'contacts')
    }
    const id = setInterval(tick, 20000)
    const url = api.streamUrl()
    const live = url && typeof EventSource !== 'undefined' ? new EventSource(url) : null
    live?.addEventListener('notification', () => tick(true))
    return () => { clearInterval(id); live?.close() }
  }, [state.status, refresh])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    try { localStorage.setItem(THEME_KEY, state.theme) } catch { /* ignore */ }
  }, [state.theme])

  const run = useCallback(async (fn, okText, ...reload) => {
    try {
      const r = await fn()
      if (reload.length) await refresh(...reload)
      if (okText) toast(okText)
      return r
    } catch (e) {
      toast(e.message, 'bad')
      throw e
    }
  }, [refresh, toast])

  const actions = useMemo(() => ({
    toast, refresh,
    setTheme: (theme) => set({ theme }),
    openChat: (cid) => dispatch({ type: 'openChat', cid: String(cid) }),
    closeChat: (cid) => dispatch({ type: 'closeChat', cid: String(cid) }),
    minimizeChat: (cid, value) => dispatch({ type: 'minChat', cid: String(cid), value }),
    setHubOpen: (cid) => dispatch({ type: 'hubOpen', cid: cid ? String(cid) : null }),
    async login(email, password) { const r = await api.login(email, password); auth.token = r.token; await boot() },
    /** Returns { verificationRequired, email, emailSent } when the account must be confirmed by email first. */
    async signup(name, email, password, role) {
      const r = await api.signup(name, email, password, role)
      if (!r.token) return r
      auth.token = r.token
      await boot()
    },
    async resetPassword(token, password) {
      const r = await api.resetPassword(token, password)
      auth.token = r.token
      window.history.replaceState({}, '', '/')
      await boot()
    },
    logout() { api.logout(); userRef.current = null; dispatch({ type: 'logout' }) },

    async updateProfile(patch) {
      const next = { ...userRef.current, ...patch }
      const user = await run(() => api.updateProfile(next), 'Profile saved')
      userRef.current = user
      set({ user })
    },
    addSkill: (name) => run(() => api.addSkill(name), 'Skill added', 'skills', 'dashboard'),
    deleteSkill: (id) => run(() => api.deleteSkill(id), null, 'skills', 'dashboard'),
    addCertificate: (name) => run(() => api.addCertificate(name), 'Certificate added', 'certificates', 'dashboard'),
    deleteCertificate: (id) => run(() => api.deleteCertificate(id), null, 'certificates', 'dashboard'),

    async setProgress(rowId, progress) {
      set({ myFormations: state.myFormations.map((f) => (f.id === rowId ? { ...f, progress, status: progress >= 100 ? 'Terminée' : 'En cours' } : f)) })
      await run(() => api.setProgress(rowId, progress), progress >= 100 ? 'Formation completed 🎉' : null, 'myFormations', 'dashboard')
    },
    requestFormation: (fid, motivation) => run(() => api.requestFormation(fid, motivation), 'Enrollment request sent to HR', 'dashboard', 'formationRequests'),
    createFormation: (f) => run(() => api.createFormation(f), 'Formation created', 'formations', 'dashboard'),
    assignFormation: (fid, uid) => run(() => api.assignFormation(fid, uid), 'Formation assigned', 'myFormations', 'dashboard'),
    deleteFormation: (fid) => run(() => api.deleteFormation(fid), 'Formation removed', 'formations', 'myFormations', 'formationRequests', 'dashboard'),
    formationHrReview: (id) => run(() => api.formationHrReview(id), 'Forwarded to the manager', 'formationRequests', 'dashboard'),
    formationManagerConfirm: (id) => run(() => api.formationManagerConfirm(id), 'Enrollment confirmed', 'formationRequests', 'myFormations', 'dashboard'),
    rejectFormation: (id) => run(() => api.rejectFormation(id), 'Request rejected', 'formationRequests', 'dashboard'),

    requestPromotion: (p) => run(() => api.requestPromotion(p), 'Promotion request sent — HR reviews it first', 'promotions', 'dashboard', 'employees'),
    hrReview: (id, c) => run(() => api.hrReview(id, c), 'Approved — now waiting for the manager', 'promotions', 'dashboard'),
    managerApprove: (id, p) => run(() => api.managerApprove(id, p), 'Promotion approved', 'promotions', 'dashboard', 'employees'),
    rejectPromotion: (id, c) => run(() => api.rejectPromotion(id, c), 'Request rejected', 'promotions', 'dashboard'),

    createTeam: (t) => run(() => api.createTeam(t), 'Team created', 'teams'),
    addMember: (tid, m) => run(() => api.addMember(tid, m), 'Member added', 'teams'),
    memberFeedback: (mid, r, f) => run(() => api.memberFeedback(mid, r, f), 'Feedback saved', 'teams'),

    /* ---------- course content ---------- */
    async loadResources(fid) {
      try {
        const list = await api.resources(fid)
        dispatch({ type: 'resources', fid, list })
      } catch (e) {
        if (e.status === 404) dispatch({ type: 'set', patch: { contentAvailable: false } }) // backend module not installed
        else toast(e.message, 'bad')
      }
    },
    async uploadResources(fid, files, onProgress) {
      const created = await run(() => api.uploadResources(fid, files, onProgress), `${files.length} item${files.length > 1 ? 's' : ''} uploaded`)
      await actions.loadResources(fid)
      await refresh('myFormations', 'dashboard')
      return created
    },
    async addResourceLink(fid, title, url) {
      await run(() => api.addResourceLink(fid, title, url), 'Link added')
      await actions.loadResources(fid)
    },
    async renameResource(fid, rid, title) {
      dispatch({ type: 'resources', fid, list: (state.resources[fid] ?? []).map((r) => (r.id === rid ? { ...r, title } : r)) })
      await run(() => api.updateResource(rid, { title })).catch(() => actions.loadResources(fid))
    },
    async deleteResource(fid, rid) {
      dispatch({ type: 'resources', fid, list: (state.resources[fid] ?? []).filter((r) => r.id !== rid) })
      await run(() => api.deleteResource(rid), 'Removed', 'myFormations').catch(() => actions.loadResources(fid))
    },
    async completeResource(fid, rid, done) {
      dispatch({ type: 'resources', fid, list: (state.resources[fid] ?? []).map((r) => (r.id === rid ? { ...r, done } : r)) })
      try {
        const { progress } = await api.completeResource(rid, done)
        if (progress != null) {
          dispatch({ type: 'set', patch: { myFormations: state.myFormations.map((f) => (f.formationId === fid ? { ...f, progress, status: progress >= 100 ? 'Terminée' : 'En cours' } : f)) } })
          if (progress >= 100) toast('Formation completed 🎉')
        }
        refresh('dashboard')
      } catch (e) {
        toast(e.message, 'bad'); actions.loadResources(fid)
      }
    },

    markNotif(n) {
      if (n.chat) { dispatch({ type: 'clearUnread', cid: n.chat }); api.markChatRead(n.chat) }
      if (n.serverId) {
        dispatch({ type: 'set', patch: { serverNotifs: (state.serverNotifs ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)) } })
        api.readNotification(n.serverId).catch(() => {})
      } else {
        const v = { ...state.notifRead, [n.id]: 1 }
        dispatch({ type: 'notifRead', value: v }); writeJSON(`ch_notif_read_${state.user.id}`, v)
      }
    },
    markAllNotifs(list) {
      list.filter((n) => n.chat).forEach((n) => dispatch({ type: 'clearUnread', cid: n.chat }))
      if (state.serverNotifs) {
        dispatch({ type: 'set', patch: { serverNotifs: state.serverNotifs.map((x) => ({ ...x, read: true })) } })
        api.readAllNotifications().catch(() => {})
      }
      const v = { ...state.notifRead, __first: state.notifRead.__first ?? Date.now() }
      list.forEach((n) => { v[n.id] = 1 })
      dispatch({ type: 'notifRead', value: v }); writeJSON(`ch_notif_read_${state.user.id}`, v)
    },
    setNotifPrefs(patch) {
      const v = { ...state.notifPrefs, ...patch }
      dispatch({ type: 'set', patch: { notifPrefs: v } }); writeJSON('ch_notif_prefs', v)
    },
    react: (cid, msgId, emoji) => dispatch({ type: 'react', key: `${cid}:${msgId}`, emoji }),
    setChatPref: (cid, patch) => dispatch({ type: 'chatPref', cid: String(cid), patch }),
    async sendChat(contactId, text, replyTo) {
      const msg = await run(() => api.sendChat(contactId, text))
      const cid = String(contactId)
      // replyTo is kept client-side: the API stores plain text only
      dispatch({ type: 'chat', cid, msg: { id: msg.id, text: msg.text, sender: 'me', time: msg.time, replyTo } })
      if (DEMO) {
        timers.current.push(setTimeout(() => set({ typing: cid }), 700))
        timers.current.push(setTimeout(async () => {
          const { autoReplies } = await import('../data/mock') // demo-only data stays out of the real app's bundle
          set({ typing: null })
          dispatch({ type: 'chat', cid, msg: { id: Date.now(), text: autoReplies[Math.floor(Math.random() * autoReplies.length)], sender: 'contact', at: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) } })
        }, 2300))
      }
    },
  }), [toast, refresh, boot, run, state.myFormations, state.serverNotifs, state.notifRead, state.notifPrefs, state.user, state.resources])

  return <Ctx.Provider value={{ state, actions }}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

/* ---------------- derived data ---------------- */
export function useDerived() {
  const { state } = useStore()
  return useMemo(() => {
    const { user, formations, myFormations, skills, certificates, promotions, teams } = state
    const role = user?.role
    const isStaff = STAFF.includes(role)
    const catalog = new Map(formations.map((f) => [f.id, f]))
    const mine = myFormations.map((m) => ({ ...m, skills: catalog.get(m.formationId)?.skills ?? [], category: catalog.get(m.formationId)?.category }))
    const completed = mine.filter((f) => f.progress >= 100)
    const active = mine.filter((f) => f.progress < 100)
    const avgProgress = mine.length ? Math.round(mine.reduce((s, f) => s + f.progress, 0) / mine.length) : 0
    const enrolledIds = new Set(mine.map((f) => f.formationId))
    const available = formations.filter((f) => f.available && !enrolledIds.has(f.id))
    const hours = Math.round(mine.reduce((s, f) => s + num(f.duration) * (f.progress / 100), 0) * 10) / 10

    const myPromotions = promotions.filter((p) => p.employeeId === user?.id)
    const openRequest = myPromotions.find((p) => p.status === 'pending' || p.status === 'on-hold')

    const R = PROMOTION_RULES
    const requirements = [
      { key: 'formations', kind: 'Formations', label: `Complete ${R.minCompletedFormations} formation${R.minCompletedFormations > 1 ? 's' : ''}`, detail: `${completed.length} completed`, done: completed.length >= R.minCompletedFormations, to: '/formations', value: Math.min(1, completed.length / R.minCompletedFormations) },
      { key: 'certificates', kind: 'Certification', label: `Hold ${R.minCertificates} certificate${R.minCertificates > 1 ? 's' : ''}`, detail: `${certificates.length} on your profile`, done: certificates.length >= R.minCertificates, to: '/profile', value: Math.min(1, certificates.length / R.minCertificates) },
      { key: 'progress', kind: 'Learning', label: `Average progress ≥ ${R.minAvgProgress}%`, detail: `You are at ${avgProgress}%`, done: avgProgress >= R.minAvgProgress, to: '/formations', value: Math.min(1, avgProgress / R.minAvgProgress) },
      { key: 'profile', kind: 'Profile', label: 'Position & department filled in', detail: user?.position ? `${user.position} · ${user.department || '—'}` : 'Missing position', done: !!(user?.position && user?.department), to: '/profile', value: user?.position && user?.department ? 1 : 0 },
    ]
    const doneCount = requirements.filter((r) => r.done).length
    const eligible = doneCount === requirements.length && !openRequest

    // Skill mastery: declared skills + formation coverage × progress + certificate bonus.
    const names = new Map()
    const touch = (n) => { const k = n.trim(); if (!names.has(k.toLowerCase())) names.set(k.toLowerCase(), { name: k, declared: false, sources: [], score: 0 }); return names.get(k.toLowerCase()) }
    skills.forEach((s) => { const e = touch(s.name); e.declared = true; e.id = s.id })
    mine.forEach((f) => f.skills.forEach((sk) => touch(sk).sources.push({ title: f.title, progress: f.progress })))
    const mastery = [...names.values()].map((e) => {
      const fromFormations = e.sources.reduce((s, x) => s + x.progress * 0.6, 0)
      const certified = certificates.some((c) => c.name.toLowerCase().includes(e.name.toLowerCase()))
      const score = Math.min(100, Math.round((e.declared ? 30 : 0) + fromFormations + (certified ? 15 : 0)))
      return { ...e, certified, score }
    }).sort((a, b) => b.score - a.score)

    const meName = fullName(user).toLowerCase()
    const myTeam = teams.find((t) => t.employees.some((e) => e.name.toLowerCase() === meName)) ?? teams[0]
    // chat contacts: accounts from the API (managers and HR included); the demo builds them from team members
    const contacts = state.contacts ?? (isStaff ? teams.flatMap((t) => t.employees.map((e) => ({ ...e, team: t.name }))) : (myTeam?.employees ?? []).map((e) => ({ ...e, team: myTeam.name })))
      .filter((e) => e.name.toLowerCase() !== meName)

    return { role, isStaff, mine, completed, active, available, avgProgress, hours, myPromotions, openRequest, requirements, doneCount, eligible, mastery, myTeam, contacts }
  }, [state])
}

/* Helpers shared by pages */
const palette = [
  ['#ff7a59', '#c2253a'], ['#ffb35c', '#e0513b'], ['#9b6bff', '#5424c9'], ['#ff5f8f', '#9c1f52'],
  ['#f6d365', '#e08a1e'], ['#4fd1c5', '#1a6f86'], ['#7f8cff', '#3440b8'], ['#63b3ff', '#2456d6'],
]
export const gradientFor = (id) => { const [a, b] = palette[Math.abs(+id || 0) % palette.length]; return `linear-gradient(135deg, ${a}, ${b})` }
export const colorFor = (s = '') => palette[[...s].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length][1]
const iconMap = [[/contain|kube|docker/i, 'Container'], [/cloud|aws|gcp|azure/i, 'Cloud'], [/auto|terraform|iac|ci|cd|devops/i, 'GitBranch'], [/sre|observ|monitor/i, 'Activity'], [/lead|manage/i, 'Crown'], [/secur|network/i, 'Shield'], [/data|sql|analy/i, 'ChartLine'], [/front|web|react|design/i, 'Layers']]
export const iconFor = (text = '') => iconMap.find(([re]) => re.test(text))?.[1] ?? 'BookOpen'
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
/** Axis labels for the weekly charts, oldest first. Kept here so pages can build chart data without loading recharts. */
export const weekLabels = (n) => Array.from({ length: n }, (_, i) => (i === n - 1 ? 'This wk' : `${n - 1 - i}w ago`))
