// CV analysis, done locally: the CV text never leaves this server. It reads skills, experience, title and seniority from
// the text, scores the CV, finds the skills missing for the person's track, then ranks the real catalog and the real
// managers against that. Pure functions: `analyzeCv(text, context)` has no I/O, so it is easy to test.

// Canonical skill → how it is written in CVs (English and French). Order matters only for display.
export const SKILLS = [
  ['AWS', /\b(aws|amazon web services|ec2|lambda|cloudformation)\b/],
  ['Azure', /\b(azure|az-\d{3})\b/],
  ['Google Cloud', /\b(gcp|google cloud)\b/],
  ['Kubernetes', /\b(kubernetes|k8s|eks|aks|gke|kubectl|cka|ckad)\b/],
  ['Docker', /\b(docker|containeri[sz]ation|containers?)\b/],
  ['Terraform', /\b(terraform|infrastructure as code|iac)\b/],
  ['Ansible', /\bansible\b/],
  ['Helm', /\bhelm\b/],
  ['Linux', /\b(linux|ubuntu|debian|centos|bash|shell scripting)\b/],
  ['Red Hat', /\b(red ?hat|rhel|rhcsa|rhce|openshift)\b/],
  ['CI/CD', /\b(ci\s*\/\s*cd|ci-cd|continuous (integration|delivery|deployment)|int[ée]gration continue|pipelines?)\b/],
  ['GitHub Actions', /\bgithub actions\b/],
  ['GitLab', /\bgitlab\b/],
  ['Jenkins', /\bjenkins\b/],
  ['Git', /\bgit\b/],
  ['Prometheus', /\bprometheus\b/],
  ['Grafana', /\bgrafana\b/],
  ['Observability', /\b(observability|monitoring|supervision|logging|tracing|elk|datadog|opentelemetry)\b/],
  ['Networking', /\b(networking|r[ée]seaux?|tcp\/ip|dns|vpn|firewall|routing|cisco|ccna)\b/],
  ['Security', /\b(security|s[ée]curit[ée]|cybersecurity|owasp|iam|pentest|siem|soc 2|iso 27001)\b/],
  ['Python', /\bpython\b/],
  ['JavaScript', /\b(javascript|es6|ecmascript)\b/],
  ['TypeScript', /\btypescript\b/],
  ['React', /\breact(\.js|js)?\b/],
  ['Node.js', /\bnode(\.js|js)?\b/],
  ['Java', /\bjava\b/],
  ['Spring', /\bspring( boot)?\b/],
  ['PHP', /\bphp\b/],
  ['Symfony', /\bsymfony\b/],
  ['SQL', /\b(sql|mysql|postgres(ql)?|mariadb|oracle db|sql server|pl\/sql)\b/],
  ['MongoDB', /\bmongo(db)?\b/],
  ['Redis', /\bredis\b/],
  ['Kafka', /\bkafka\b/],
  ['Data analysis', /\b(data analysis|analyse de donn[ée]es|analytics|power bi|tableau|pandas)\b/],
  ['Machine learning', /\b(machine learning|apprentissage automatique|deep learning|tensorflow|pytorch|scikit-learn)\b/],
  ['Figma', /\bfigma\b/],
  ['UI/UX', /\b(ui\s*\/\s*ux|ux design|user experience|design system)\b/],
  ['Flutter', /\bflutter\b/],
  ['Agile', /\b(agile|scrum|kanban|jira|sprints?)\b/],
  ['Testing', /\b(unit tests?|testing|tests unitaires|jest|cypress|selenium|tdd)\b/],
  ['Leadership', /\b(leadership|led (a|the) team|team lead|tech lead|managed (a|the) team|mentor(ing|ed)?|encadrement|chef d'[ée]quipe)\b/],
  ['Communication', /\b(communication|presentations?|public speaking|stakeholders?)\b/],
  ['Project management', /\b(project management|gestion de projets?|pmp|prince2|roadmap)\b/],
]

// A track is the family a title belongs to; its path skills are what that family needs to grow.
const TRACKS = {
  infra: { label: 'Cloud & infrastructure', skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD', 'Observability', 'Linux', 'Security'] },
  software: { label: 'Software engineering', skills: ['TypeScript', 'React', 'Node.js', 'SQL', 'Testing', 'CI/CD', 'Docker', 'Git'] },
  data: { label: 'Data', skills: ['Python', 'SQL', 'Data analysis', 'Machine learning', 'Kafka', 'Observability'] },
  security: { label: 'Security & networks', skills: ['Security', 'Networking', 'Linux', 'AWS', 'Observability', 'Terraform'] },
  design: { label: 'Product design', skills: ['Figma', 'UI/UX', 'React', 'Communication'] },
  lead: { label: 'Leadership', skills: ['Leadership', 'Agile', 'Project management', 'Communication'] },
}
const TITLES = [
  ['Site Reliability Engineer', /\b(site reliability engineer|sre)\b/, 'infra'],
  ['DevOps Engineer', /\bdevops( engineer| ing[ée]nieur)?\b/, 'infra'],
  ['Cloud Engineer', /\b(cloud (engineer|architect|ing[ée]nieur))\b/, 'infra'],
  ['Platform Engineer', /\bplatform engineer\b/, 'infra'],
  ['System Administrator', /\b(system(s)? administrator|sysadmin|administrateur syst[èe]mes?)\b/, 'infra'],
  ['Network Engineer', /\b(network engineer|ing[ée]nieur r[ée]seaux?)\b/, 'security'],
  ['Security Engineer', /\b(security (engineer|analyst)|analyste s[ée]curit[ée])\b/, 'security'],
  ['Data Scientist', /\bdata scientist\b/, 'data'],
  ['Data Engineer', /\bdata engineer\b/, 'data'],
  ['Data Analyst', /\b(data analyst|analyste de donn[ée]es)\b/, 'data'],
  ['Full-stack Developer', /\b(full[- ]?stack)( developer| engineer| d[ée]veloppeur)?\b/, 'software'],
  ['Frontend Developer', /\b(front[- ]?end)( developer| engineer| d[ée]veloppeur)?\b/, 'software'],
  ['Backend Developer', /\b(back[- ]?end)( developer| engineer| d[ée]veloppeur)?\b/, 'software'],
  ['Mobile Developer', /\b(mobile|android|ios|flutter) (developer|engineer|d[ée]veloppeur)\b/, 'software'],
  ['QA Engineer', /\b(qa|quality assurance|test) engineer\b/, 'software'],
  ['Software Engineer', /\b(software (engineer|developer)|d[ée]veloppeur|developer|ing[ée]nieur logiciel)\b/, 'software'],
  ['UI/UX Designer', /\b(ui\s*\/?\s*ux|product|ux|ui) designer\b/, 'design'],
  ['Engineering Manager', /\b(engineering manager|head of engineering)\b/, 'lead'],
  ['Project Manager', /\b(project manager|chef de projet)\b/, 'lead'],
  ['Product Manager', /\b(product (manager|owner))\b/, 'lead'],
]
const SECTIONS = [
  ['summary', /^(summary|profile|profil|about( me)?|objective|objectif|r[ée]sum[ée])\b/],
  ['experience', /^(experience|work experience|professional experience|employment|exp[ée]riences?( professionnelles?)?|parcours professionnel)\b/],
  ['education', /^(education|[ée]ducation|formations?( acad[ée]miques?)?|academic|dipl[ôo]mes?|studies)\b/],
  ['skills', /^(skills|technical skills|comp[ée]tences( techniques)?|technologies|tech stack|outils)\b/],
  ['certifications', /^(certifications?|certificates?|licenses)\b/],
  ['projects', /^(projects?|projets?|portfolio)\b/],
  ['languages', /^(languages|langues)\b/],
]
const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|janv|f[ée]vr?|mars|avr|mai|juin|juil|ao[ûu]t|d[ée]c'
const RANGE = new RegExp(`(?:(?:${MONTHS})[a-zé.]*\\s*)?((?:19|20)\\d{2})\\s*(?:-|–|—|to|à|au|until|jusqu'?\\s*(?:à|en))\\s*(?:(?:${MONTHS})[a-zé.]*\\s*)?((?:19|20)\\d{2}|present|current|now|today|aujourd'?hui|actuel(?:lement)?|pr[ée]sent)`, 'gi')
const ACTION = /\b(led|built|designed|developed|launched|improved|reduced|increased|automated|migrated|delivered|created|optimi[sz]ed|scaled|mentored|implemented|con[çc]u|d[ée]velopp[ée]|automatis[ée]|am[ée]lior[ée]|r[ée]duit|dirig[ée])\b/g
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9+#]/g, '')

/** Split the text into named sections using heading-like short lines. */
function sectionsOf(lines) {
  const out = { _: [] }
  let current = '_'
  for (const line of lines) {
    const head = line.trim().toLowerCase().replace(/[:•\-–|]+$/, '').trim()
    const hit = head.length <= 40 && SECTIONS.find(([, re]) => re.test(head))
    if (hit) { current = hit[0]; out[current] ??= []; continue }
    out[current] ??= []
    out[current].push(line)
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('\n')]))
}

/** Years of experience: an explicit "N years" if stated, else merged date ranges (outside education). */
function experienceYears(text, sections, now = new Date()) {
  const explicit = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs|ans|ann[ée]es)\b/gi)].map((m) => Number(m[1])).filter((n) => n > 0 && n < 45)
  const source = sections.experience || Object.entries(sections).filter(([k]) => k !== 'education').map(([, v]) => v).join('\n')
  const year = now.getUTCFullYear() + now.getUTCMonth() / 12
  const spans = [...source.matchAll(RANGE)].map((m) => {
    const start = Number(m[1])
    const end = /^\d/.test(m[2]) ? Number(m[2]) + 0.5 : year
    return [start, Math.max(start + 0.25, end)]
  }).filter(([a, b]) => a >= 1970 && b <= year + 1).sort((a, b) => a[0] - b[0])
  let total = 0, cur = null
  for (const s of spans) {
    if (!cur || s[0] > cur[1]) { if (cur) total += cur[1] - cur[0]; cur = [...s] } else cur[1] = Math.max(cur[1], s[1])
  }
  if (cur) total += cur[1] - cur[0]
  const years = explicit.length ? Math.max(...explicit) : total // the person's own statement wins over dates
  return Math.round(years * 2) / 2
}

const seniorityOf = (years) => (years < 2 ? 'Junior' : years < 5 ? 'Mid-level' : years < 9 ? 'Senior' : 'Lead')

/** Skills found in the text: the built-in vocabulary plus every skill name the company already uses. */
export function findSkills(text, extraNames = []) {
  const lower = text.toLowerCase()
  const found = new Map()
  for (const [name, re] of SKILLS) {
    const hits = lower.match(new RegExp(re.source, 'g'))
    if (hits) found.set(name, hits.length)
  }
  const known = new Set([...found.keys()].map(norm))
  for (const name of extraNames) {
    if (!name || known.has(norm(name)) || name.length < 2) continue
    const re = new RegExp(`(^|[^a-z0-9])${esc(name.toLowerCase())}($|[^a-z0-9])`, 'g')
    const hits = lower.match(re)
    if (hits) { found.set(name, hits.length); known.add(norm(name)) }
  }
  return [...found.entries()].sort((a, b) => b[1] - a[1]).map(([name, mentions]) => ({ name, mentions }))
}

/** The best title match: earliest in the document, then most mentioned. */
function titleOf(text) {
  const lower = text.toLowerCase()
  const hits = TITLES.map(([title, re, track]) => {
    const all = [...lower.matchAll(new RegExp(re.source, 'g'))]
    return all.length ? { title, track, first: all[0].index, count: all.length } : null
  }).filter(Boolean)
  if (!hits.length) return null
  hits.sort((a, b) => (a.first - b.first) || (b.count - a.count))
  return hits[0]
}

/** 0–100 score of how well the CV presents the person, with the quick wins that would raise it. */
function strengthOf(text, sections, skills) {
  const words = text.split(/\s+/).filter(Boolean).length
  const numbers = (text.match(/\b\d+(?:[.,]\d+)?\s*(?:%|k\b|x\b|×|€|\$|(?:services|users|clients|customers|servers|projects|people|teams|pipelines|apps|applications|hours|days|weeks|ms|seconds|requests|million|tb|gb|serveurs|utilisateurs|projets)\b)/gi) ?? []).length
  const actions = (text.toLowerCase().match(ACTION) ?? []).length
  const parts = [
    ['Contact details', /[\w.+-]+@[\w-]+\.[\w.]+/.test(text) || /\+?\d[\d\s().-]{7,}\d/.test(text), 8, 'Add an email or phone number at the top.'],
    ['Summary', !!sections.summary, 7, 'Open with a 2–3 line summary of who you are and what you want next.'],
    ['Experience', !!sections.experience, 18, 'Add an Experience section with roles, companies and dates.'],
    ['Education', !!sections.education, 8, 'List your degree or training in an Education section.'],
    ['Skills section', !!sections.skills, 10, 'Group your tools in a Skills section so they are easy to scan.'],
    ['Certifications', !!sections.certifications, 6, 'Mention certifications — they count toward your promotion here too.'],
    ['Projects', !!sections.projects, 5, 'Show one or two projects with what you built and the result.'],
    ['Range of skills', skills.length >= 6, 12, 'Name the concrete tools you use (at least six), not only categories.'],
    ['Measured results', numbers >= 2, 14, 'Quantify results: “cut deploy time by 40 %”, “served 20k users”.'],
    ['Action verbs', actions >= 3, 7, 'Start bullets with verbs: built, led, automated, reduced…'],
    ['Length', words >= 180 && words <= 1100, 5, words < 180 ? 'Your CV is very short — add detail to your last two roles.' : 'Trim to the essentials: one or two pages.'],
  ]
  const score = parts.reduce((s, [, ok, w]) => s + (ok ? w : 0), 0)
  return {
    score: clamp(Math.round(score), 0, 100),
    checks: parts.map(([label, ok]) => ({ label, ok })),
    tips: parts.filter(([, ok]) => !ok).sort((a, b) => b[2] - a[2]).slice(0, 4).map(([, , , tip]) => tip),
    words,
  }
}

const levelFit = (seniority, level) => {
  const want = { Junior: ['Débutant', 'Intermédiaire'], 'Mid-level': ['Intermédiaire', 'Avancé'], Senior: ['Avancé', 'Intermédiaire'], Lead: ['Avancé'] }[seniority] ?? []
  return want[0] === level ? 12 : want.includes(level) ? 6 : seniority === 'Junior' && level === 'Avancé' ? -10 : 0
}
const list = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`)

/**
 * @param {string} text  the CV's plain text
 * @param {object} ctx   { formations: [{id,title,level,category,skills[],instructor,duration,iconUrl}], enrollments: {formationId:{progress}},
 *                         managers: [{id,name,avatar,position,department,teams:[{name,members,rating}],skills[]}], myManagerIds: Set,
 *                         profileSkills: [], companySkills: [{name,count}], department, now }
 */
export function analyzeCv(text, ctx) {
  const clean = String(text ?? '').replace(/\r/g, '').replace(/[ \t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean)
  const sections = sectionsOf(lines)
  const vocabulary = [...new Set([...ctx.formations.flatMap((f) => f.skills), ...ctx.companySkills.map((s) => s.name), ...ctx.managers.flatMap((m) => m.skills)])]
  const skills = findSkills(clean, vocabulary)
  const has = new Set(skills.map((s) => norm(s.name)))
  const hasSkill = (name) => has.has(norm(name))
  const years = experienceYears(clean, sections, ctx.now)
  const seniority = seniorityOf(years)
  const detected = titleOf(clean)
  const track = detected?.track ?? (skills.some((s) => TRACKS.infra.skills.includes(s.name)) ? 'infra' : skills.some((s) => TRACKS.software.skills.includes(s.name)) ? 'software' : 'lead')
  const title = detected?.title ?? null
  const strength = strengthOf(clean, sections, skills)

  // skills missing for the track, most useful first (taught in the catalog, common in the company)
  const taught = new Set(ctx.formations.flatMap((f) => f.skills).map(norm))
  const common = new Map(ctx.companySkills.map((s) => [norm(s.name), s.count]))
  const gaps = TRACKS[track].skills.filter((s) => !hasSkill(s) && !ctx.profileSkills.some((p) => norm(p) === norm(s)))
    .map((name, i) => ({ name, priority: clamp(84 - i * 11 + (taught.has(norm(name)) ? 8 : 0) + Math.min(8, (common.get(norm(name)) ?? 0) * 2), 22, 98), taught: taught.has(norm(name)) }))
    .sort((a, b) => b.priority - a.priority).slice(0, 6)
  const gapSet = new Set(gaps.map((g) => norm(g.name)))

  // formations: fill gaps first, build on strengths, fit the level; skip what's done
  const formations = ctx.formations.map((f) => {
    const fSkills = [...new Set([...f.skills, ...findSkills(`${f.title} ${f.category ?? ''}`).map((s) => s.name)])]
    const fills = fSkills.filter((s) => gapSet.has(norm(s)))
    const builds = fSkills.filter((s) => hasSkill(s))
    const onTrack = fSkills.filter((s) => TRACKS[track].skills.some((t) => norm(t) === norm(s)))
    const enrolled = ctx.enrollments[f.id]
    if (enrolled?.progress >= 100) return null
    let score = 30 + Math.min(2, fills.length) * 30 + Math.min(2, builds.length) * 8 + Math.min(2, onTrack.length) * 6 + levelFit(seniority, f.level) - (enrolled ? 22 : 0)
    if (!fills.length && !builds.length && !onTrack.length) score -= 25
    const reasons = []
    if (fills.length) reasons.push(`Fills a gap: ${list(fills.slice(0, 2))} ${fills.length > 1 ? 'aren’t' : 'isn’t'} on your CV yet`)
    if (builds.length) reasons.push(`Builds on your ${list(builds.slice(0, 2))} experience`)
    if (levelFit(seniority, f.level) > 0) reasons.push(`${f.level} level fits a ${seniority.toLowerCase()} profile`)
    if (enrolled) reasons.push(`You’re already enrolled — ${enrolled.progress}% done, keep going`)
    return { id: f.id, title: f.title, level: f.level, category: f.category, duration: f.duration, instructor: f.instructor, iconUrl: f.iconUrl, skills: fSkills, match: clamp(Math.round(score), 5, 98), reasons, enrolled: !!enrolled }
  }).filter(Boolean).sort((a, b) => b.match - a.match).slice(0, 3)

  // managers: whose team knows what you lack, shares your stack, and rates well
  const managers = ctx.managers.map((m) => {
    const ms = new Set(m.skills.map(norm))
    const teaches = gaps.filter((g) => ms.has(norm(g.name))).map((g) => g.name)
    const shared = skills.filter((s) => ms.has(norm(s.name))).map((s) => s.name)
    const rating = m.teams.length ? m.teams.reduce((s, t) => s + (t.rating ?? 0), 0) / m.teams.length : null
    const sameDept = !!(m.department && ctx.department && norm(m.department) === norm(ctx.department))
    const yours = ctx.myManagerIds.has(m.id)
    const score = 20 + Math.min(3, teaches.length) * 14 + Math.min(3, shared.length) * 8 + (sameDept ? 12 : 0) + (rating ? rating * 3 : 0) + (yours ? 6 : 0) + (m.teams.length ? 6 : 0)
    const reasons = []
    if (m.teams.length) reasons.push(`Leads ${list(m.teams.map((t) => `${t.name} (${t.members} ${t.members === 1 ? 'person' : 'people'})`))}`)
    if (teaches.length) reasons.push(`The team knows ${list(teaches.slice(0, 3))} — what you need next`)
    if (shared.length) reasons.push(`Works with your stack: ${list(shared.slice(0, 3))}`)
    if (sameDept) reasons.push(`Same department: ${m.department}`)
    if (rating) reasons.push(`Team rating ${rating.toFixed(1)} / 5`)
    if (yours) reasons.push('Already your manager')
    return { id: m.id, name: m.name, avatar: m.avatar, position: m.position, department: m.department, teams: m.teams, teaches, shared, match: clamp(Math.round(score), 5, 98), reasons }
  }).sort((a, b) => b.match - a.match)

  const nextRole = title
    ? { Junior: `Mid-level ${title}`, 'Mid-level': `Senior ${title}`, Senior: hasSkill('Leadership') ? 'Engineering Manager' : `Lead ${title}`, Lead: 'Engineering Manager' }[seniority]
    : null

  return {
    title, track, trackLabel: TRACKS[track].label, years, seniority, nextRole,
    skills: skills.slice(0, 24),
    newSkills: skills.filter((s) => !ctx.profileSkills.some((p) => norm(p) === norm(s.name))).map((s) => s.name).slice(0, 12),
    strength, gaps, formations,
    manager: managers[0] ?? null,
    otherManagers: managers.slice(1, 3),
    sections: Object.keys(sections).filter((k) => k !== '_'),
  }
}
