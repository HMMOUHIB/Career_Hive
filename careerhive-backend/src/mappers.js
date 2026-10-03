// Database rows → the JSON shapes careerhive-ui expects (see its src/api/demo.js and src/data/mock.js).
import { config } from './config.js'
import { day, iso } from './http.js'

export const USER_COLUMNS = `id, first_name, last_name, email, role, position, department, education, bio, location, phone,
  profile_photo, cover_photo`

export const userOut = (u) => ({
  id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email, role: u.role,
  position: u.position, department: u.department, education: u.education, bio: u.bio,
  location: u.location, phone: u.phone, profilePhoto: u.profile_photo, coverPhoto: u.cover_photo,
  isOwner: config.staffEmails.includes(u.email), // may choose who is a manager or HR (People & roles)
})

export const fullName = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()

/** online < 2 min since last request, away < 15 min, otherwise off. */
export function presence(lastSeen) {
  if (!lastSeen) return 'off'
  const ago = Date.now() - Date.parse(iso(lastSeen))
  return ago < 120_000 ? 'online' : ago < 900_000 ? 'away' : 'off'
}

export const formationOut = (f, skills = []) => ({
  id: f.id, title: f.title, description: f.description ?? '', duration: f.duration ?? '', instructor: f.instructor ?? '',
  level: f.level, category: f.category ?? '', available: !!f.available, iconUrl: f.icon_url, skills,
})

/** user_formation_progress joined with formations. */
export const enrollmentOut = (r) => ({
  id: r.id, formationId: r.formation_id, progress: r.progress, status: r.status, startedAt: day(r.started_at),
  title: r.title, description: r.description ?? '', duration: r.duration ?? '', instructor: r.instructor ?? '', level: r.level, iconUrl: r.icon_url,
})
export const ENROLLMENT_SELECT = `SELECT p.id, p.formation_id, p.progress, p.status, p.started_at,
  f.title, f.description, f.duration, f.instructor, f.level, f.icon_url
  FROM user_formation_progress p JOIN formations f ON f.id = p.formation_id`

export function promotionOut(p, skills = [], certificates = []) {
  return {
    id: p.id, employeeId: p.user_id, currentPosition: p.current_position, requestedPosition: p.requested_position,
    department: p.department, currentSalary: p.current_salary, requestedSalary: p.requested_salary,
    reason: p.justification, timeline: p.timeline, submittedDate: day(p.submitted_date), status: p.status,
    achievements: (p.achievements ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
    certificates, skills,
    hrApproval: p.hr_approved == null ? null : {
      approved: !!p.hr_approved, approvedBy: p.hr_approved_by, approvedDate: day(p.hr_approved_date), comments: p.hr_comments,
    },
    managerApproval: p.manager_approved == null ? null : {
      approved: !!p.manager_approved, approvedBy: p.manager_approved_by, approvedDate: day(p.manager_approved_date),
      approvedPosition: p.manager_approved_position, approvedSalary: p.manager_approved_salary, approvedRating: p.manager_rating,
      comments: p.manager_comments,
    },
    approvedPosition: p.manager_approved_position, approvedSalary: p.manager_approved_salary ?? 0, approvedRating: p.manager_rating ?? 0,
  }
}

export const resourceOut = (r, done = false) => ({
  id: r.id, formationId: r.formation_id, kind: r.kind, title: r.title, url: r.url, fileName: r.file_name,
  mime: r.mime, size: r.size, createdAt: iso(r.created_at), done,
})

export const notificationOut = (n) => ({
  id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, contactId: n.contact_id,
  isRead: !!n.is_read, createdAt: iso(n.created_at),
})
