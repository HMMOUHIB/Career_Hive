/**
 * Notification feed.
 *
 * If the backend exposes GET /api/notifications (see backend-additions/), those are used as-is.
 * Otherwise the feed is DERIVED from data the current API already returns: promotion decisions,
 * formation-request decisions, newly assigned formations, the staff review queue and unread chats.
 * Read state for derived items is kept per user in localStorage.
 */

const DAY = 864e5
export const toMs = (v) => {
  if (v == null) return Date.now()
  if (typeof v === 'number') return v
  const t = Date.parse(v)
  return Number.isNaN(t) ? Date.now() : t
}

export function timeAgo(ms, dateOnly) {
  if (dateOnly) {
    const d = new Date(ms), now = new Date()
    const days = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())) / 864e5)
    if (days <= 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  }
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60); if (m < 60) return `${m}m`
  const h = Math.round(m / 60); if (h < 24) return `${h}h`
  const d = Math.round(h / 24); if (d < 7) return `${d}d`
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const TYPE_STYLE = {
  message: { icon: 'MessageCircle', color: 'var(--chart-b)' },
  promotion: { icon: 'TrendingUp', color: 'var(--accent)' },
  promoted: { icon: 'Trophy', color: 'var(--good)' },
  rejected: { icon: 'CircleX', color: 'var(--bad)' },
  formation: { icon: 'GraduationCap', color: '#7b5cff' },
  review: { icon: 'ClipboardCheck', color: 'var(--warn)' },
  info: { icon: 'Bell', color: 'var(--accent)' },
  social: { icon: 'Heart', color: '#e8508a' }, // follows, likes, comments and new posts
}

export function deriveNotifications(state, contacts) {
  const { user, dashboard, promotions, myFormations, chat, unread } = state
  if (!user) return []
  const out = []
  const push = (n) => out.push({ ...n, at: toMs(n.at), dateOnly: typeof n.at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n.at) })

  // Chats with unread messages
  Object.entries(unread).forEach(([cid, count]) => {
    if (!count) return
    const c = contacts.find((x) => String(x.id) === cid)
    if (!c) return
    const lastIn = [...(chat[cid] ?? [])].reverse().find((m) => m.sender !== 'me')
    push({
      id: `chat-${cid}-${lastIn?.id ?? count}`, type: 'message', chat: cid, avatar: c,
      title: c.name, body: `${lastIn?.text ?? 'New message'}${count > 1 ? `  ·  ${count} new` : ''}`,
      at: lastIn?.at ?? Date.now(), live: true,
    })
  })

  // My promotion requests
  promotions.filter((p) => p.employeeId === user.id).forEach((p) => {
    if (p.hrApproval?.approved) {
      push({ id: `promo-${p.id}-hr`, type: 'promotion', link: '/promotion', at: p.hrApproval.approvedDate,
        title: 'HR approved your promotion request', body: `${p.requestedPosition} is now with your manager.${p.hrApproval.comments ? ` “${p.hrApproval.comments}”` : ''}` })
    }
    if (p.status === 'approved') {
      push({ id: `promo-${p.id}-ok`, type: 'promoted', link: '/promotion', at: p.managerApproval?.approvedDate,
        title: 'You got the promotion 🎉', body: `Approved as ${p.approvedPosition ?? p.requestedPosition}.${p.managerApproval?.comments ? ` “${p.managerApproval.comments}”` : ''}` })
    }
    if (p.status === 'rejected') {
      const v = p.managerApproval?.approved === false ? p.managerApproval : p.hrApproval
      push({ id: `promo-${p.id}-no`, type: 'rejected', link: '/promotion', at: v?.approvedDate,
        title: 'Promotion request not approved', body: v?.comments ? `“${v.comments}”` : `${p.requestedPosition} — you can apply again later.` })
    }
  })

  // My formation enrollment requests
  ;(dashboard?.me?.formationRequests ?? []).forEach((r) => {
    if (r.status === 'on-hold') push({ id: `freq-${r.id}-hr`, type: 'formation', link: '/formations?tab=requests', at: r.requestedAt, title: `HR approved “${r.title}”`, body: 'Waiting for your manager to confirm the enrollment.' })
    if (r.status === 'approved') push({ id: `freq-${r.id}-ok`, type: 'formation', link: '/formations', at: r.requestedAt, title: `You're enrolled in “${r.title}”`, body: 'It is now in My formations.' })
    if (r.status === 'rejected') push({ id: `freq-${r.id}-no`, type: 'rejected', link: '/formations?tab=requests', at: r.requestedAt, title: `“${r.title}” request declined`, body: 'Talk to your manager about alternatives.' })
  })

  // Newly assigned formations (started recently, not begun yet)
  myFormations.filter((f) => f.progress === 0 && Date.now() - toMs(f.startedAt) < 14 * DAY).forEach((f) => {
    push({ id: `assign-${f.id}`, type: 'formation', link: `/formations?open=${f.formationId}`, at: f.startedAt, title: 'New formation assigned', body: f.title })
  })

  // Staff: items waiting on me
  const q = dashboard?.org?.queue
  q?.promotions?.forEach((r) => push({ id: `queue-p-${r.id}-${r.status}`, type: 'review', link: '/reviews', at: r.date, title: `${r.employee} asks for a promotion`, body: `${r.currentPosition} → ${r.requestedPosition}` }))
  q?.formations?.forEach((r) => push({ id: `queue-f-${r.id}-${r.status}`, type: 'review', link: '/reviews', at: r.date, title: `${r.employee} wants to join a formation`, body: r.formation }))

  return out.sort((a, b) => b.at - a.at)
}

export function fromServer(list) {
  return list.map((n) => ({
    id: `srv-${n.id}`, serverId: n.id, type: n.type ?? 'info', title: n.title, body: n.body, link: n.link,
    at: toMs(n.createdAt), read: !!n.isRead, chat: n.type === 'message' && n.contactId ? String(n.contactId) : undefined,
  }))
}

/* short two-tone "pop" for new notifications */
let audio
export function playPop() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)()
    const t = audio.currentTime
    ;[[880, 0], [1320, 0.09]].forEach(([f, d]) => {
      const o = audio.createOscillator(), g = audio.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.12, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.22)
      o.connect(g).connect(audio.destination); o.start(t + d); o.stop(t + d + 0.25)
    })
  } catch { /* audio not available */ }
}
