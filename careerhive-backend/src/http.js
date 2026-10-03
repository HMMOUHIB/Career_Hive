import { config } from './config.js'

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code // optional machine-readable reason, e.g. EMAIL_NOT_VERIFIED
  }
}
/** Throw an HTTP error; Express 5 turns a rejected async handler into a JSON { message, code? } response. */
export const fail = (status, message, code) => { throw new HttpError(status, message, code) }

export const STAFF = ['manager', 'hr', 'admin']
export const isStaff = (user) => STAFF.includes(user.role)

/** Positive integer route/body id, or 400. */
export function id(value, what = 'id') {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) fail(400, `Invalid ${what}.`)
  return n
}

/** Trimmed string within bounds; `null` when optional and empty. */
export function text(value, { field, max = 255, required = false } = {}) {
  const s = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
  if (!s) return required ? fail(400, `${field} is required.`) : null
  if (s.length > max) fail(400, `${field} must be at most ${max} characters.`)
  return s
}

/** DATETIME string from MySQL (stored in UTC) → ISO 8601. */
export const iso = (s) => (s ? new Date(`${String(s).replace(' ', 'T')}Z`).toISOString() : null)
/** DATE or DATETIME → 'YYYY-MM-DD'. */
export const day = (s) => (s ? String(s).slice(0, 10) : null)

const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: config.timeZone })
const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: config.timeZone })
const short = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: config.timeZone })
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: config.timeZone }) // YYYY-MM-DD
/** Chat label like the UI's demo data: "11:05" today, "Mon" this week, else "12 Sep". */
export function chatTime(s) {
  const d = new Date(iso(s))
  const days = (Date.parse(ymd.format(new Date())) - Date.parse(ymd.format(d))) / 864e5
  if (days < 1) return clock.format(d)
  if (days < 7) return weekday.format(d)
  return short.format(d)
}
