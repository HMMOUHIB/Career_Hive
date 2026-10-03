// Demo data, shaped exactly like the CareerHive Express API responses (server.js).
// Used only when VITE_API_URL is not set.

export const users = {
  student: {
    id: 7, firstName: 'Amine', lastName: 'Trabelsi', email: 'amine@careerhive.tn', role: 'student',
    position: 'Cloud Engineer II', department: 'Infrastructure', education: 'Engineering degree — TEK-UP',
    bio: 'Cloud engineer who likes boring, reliable infrastructure.', location: 'Tunis', phone: '+216 20 000 000',
    profilePhoto: null, coverPhoto: null,
  },
  hr: {
    id: 2, firstName: 'Leila', lastName: 'Mansour', email: 'leila@careerhive.tn', role: 'hr',
    position: 'HR Director', department: 'People', education: '', bio: '', location: 'Tunis', phone: '', profilePhoto: null, coverPhoto: null,
  },
  manager: {
    id: 3, firstName: 'Sarra', lastName: 'Ben Youssef', email: 'sarra@careerhive.tn', role: 'manager',
    position: 'Engineering Manager', department: 'Infrastructure', education: '', bio: '', location: 'Tunis', phone: '', profilePhoto: null, coverPhoto: null,
  },
}

export const formations = [
  { id: 1, title: 'Kubernetes in Production', description: 'Clusters, workloads, autoscaling and day-2 operations on real traffic.', duration: '14h', instructor: 'Yassine Mejri', level: 'Avancé', category: 'Containers', available: true, iconUrl: 'https://cdn.simpleicons.org/kubernetes', skills: ['Kubernetes', 'Docker', 'Helm'] },
  { id: 2, title: 'AWS Solutions Architecture', description: 'Design resilient, cost-aware systems on AWS.', duration: '18h', instructor: 'Karim Haddad', level: 'Intermédiaire', category: 'Cloud', available: true, iconUrl: null, skills: ['AWS', 'Architecture'] },
  { id: 3, title: 'Terraform & IaC Patterns', description: 'Modules, state, workspaces and safe rollouts.', duration: '10h', instructor: 'Omar Jlassi', level: 'Intermédiaire', category: 'Automation', available: true, iconUrl: 'https://cdn.simpleicons.org/terraform', skills: ['Terraform', 'IaC'] },
  { id: 4, title: 'Observability with Grafana', description: 'Metrics, logs and traces that actually answer questions.', duration: '8h', instructor: 'Yassine Mejri', level: 'Intermédiaire', category: 'SRE', available: true, iconUrl: 'https://cdn.simpleicons.org/grafana', skills: ['Observability', 'Prometheus'] },
  { id: 5, title: 'Leadership for Tech Leads', description: 'Run design reviews, mentor juniors and own delivery.', duration: '6h', instructor: 'Sarra Ben Youssef', level: 'Débutant', category: 'Leadership', available: true, iconUrl: null, skills: ['Leadership', 'Mentoring'] },
  { id: 6, title: 'Secure Cloud Networking', description: 'Zero-trust, private connectivity and edge protection.', duration: '12h', instructor: 'Ines Kallel', level: 'Avancé', category: 'Security', available: true, iconUrl: null, skills: ['Networking', 'Security'] },
  { id: 7, title: 'CI/CD with GitHub Actions', description: 'Fast, cached, secure pipelines from commit to prod.', duration: '5h', instructor: 'Walid Saidi', level: 'Débutant', category: 'Automation', available: true, iconUrl: 'https://cdn.simpleicons.org/githubactions', skills: ['CI/CD', 'GitHub Actions'] },
  { id: 8, title: 'Google Cloud Foundations', description: 'Core GCP services for multi-cloud engineers.', duration: '9h', instructor: 'Karim Haddad', level: 'Débutant', category: 'Cloud', available: true, iconUrl: 'https://cdn.simpleicons.org/googlecloud', skills: ['GCP'] },
]

// user_formation_progress rows joined with formations (GET /api/my-formations)
export const myFormations = [
  { id: 101, formationId: 1, progress: 62, status: 'En cours', startedAt: '2026-07-02' },
  { id: 102, formationId: 2, progress: 100, status: 'Terminée', startedAt: '2025-11-10' },
  { id: 103, formationId: 3, progress: 100, status: 'Terminée', startedAt: '2026-03-04' },
  { id: 104, formationId: 4, progress: 35, status: 'En cours', startedAt: '2026-08-18' },
  { id: 105, formationId: 7, progress: 20, status: 'En cours', startedAt: '2026-09-15' },
].map((p) => {
  const f = formations.find((x) => x.id === p.formationId)
  return { ...p, title: f.title, description: f.description, duration: f.duration, instructor: f.instructor, level: f.level, iconUrl: f.iconUrl }
})

export const skills = [
  { id: 1, name: 'AWS' }, { id: 2, name: 'Kubernetes' }, { id: 3, name: 'Terraform' },
  { id: 4, name: 'Linux' }, { id: 5, name: 'Python' }, { id: 6, name: 'CI/CD' },
]

export const certificates = [
  { id: 1, name: 'AWS Solutions Architect – Associate' },
  { id: 2, name: 'HashiCorp Terraform Associate' },
]

const week = (n) => { const d = new Date(); d.setDate(d.getDate() - n * 7); return d.toISOString().slice(0, 10) }

export const dashboard = (role) => ({
  role,
  me: {
    skills: skills.length,
    certificates: certificates.length,
    learning: { total: 5, active: 3, completed: 2, avgProgress: 63 },
    formations: myFormations.slice(0, 4),
    recommended: formations.filter((f) => [5, 6, 8].includes(f.id)).map((f, i) => ({ ...f, enrolled: [14, 9, 6][i], completed: 0, avgProgress: 0 })),
    promotion: null,
    formationRequests: [{ id: 31, title: 'Secure Cloud Networking', status: 'on-hold', requestedAt: week(1) }],
    team: { id: 1, name: 'Infra Squad', members: 6, manager: { name: 'Sarra Ben Youssef', role: 'Engineering Manager', avatar: null }, rating: 4.4, feedback: 'Strong ownership on the cluster migration.' },
    trends: { enrollments: [0, 1, 0, 0, 1, 0, 1, 1], certificates: [0, 0, 1, 0, 0, 0, 0, 1], requests: [0, 0, 0, 1, 0, 0, 1, 0] },
    activity: [
      { type: 'enrollment', id: 'enrollment-105', status: 'En cours', subject: 'CI/CD with GitHub Actions', at: week(2), person: 'Amine Trabelsi' },
      { type: 'formation_request', id: 'formation_request-31', status: 'on-hold', subject: 'Secure Cloud Networking', at: week(1), person: 'Amine Trabelsi' },
      { type: 'enrollment', id: 'enrollment-104', status: 'En cours', subject: 'Observability with Grafana', at: '2026-08-18', person: 'Amine Trabelsi' },
      { type: 'enrollment', id: 'enrollment-101', status: 'En cours', subject: 'Kubernetes in Production', at: '2026-07-02', person: 'Amine Trabelsi' },
      { type: 'certificate', id: 'certificate-2', status: null, subject: 'HashiCorp Terraform Associate', at: '2026-05-20', person: 'Amine Trabelsi' },
      { type: 'enrollment', id: 'enrollment-103', status: 'Terminée', subject: 'Terraform & IaC Patterns', at: '2026-03-04', person: 'Amine Trabelsi' },
      { type: 'certificate', id: 'certificate-1', status: null, subject: 'AWS Solutions Architect – Associate', at: '2026-01-28', person: 'Amine Trabelsi' },
      { type: 'promotion', id: 'promotion-4', status: 'approved', subject: 'Cloud Engineer II', at: '2025-05-20', person: 'Amine Trabelsi' },
    ],
  },
  org: role === 'student' ? null : {
    totals: { users: 42, employees: 34, teams: 5, teamMembers: 31, certificates: 58, catalog: 8, enrollments: 97, completedEnrollments: 41, avgProgress: 57, avgRating: 4.1, promotionQueue: 2, formationQueue: 1 },
    usersByRole: { student: 34, manager: 5, hr: 2, admin: 1 },
    popularFormations: formations.slice(0, 3).map((f, i) => ({ ...f, enrolled: [22, 19, 15][i], completed: [9, 11, 6][i], avgProgress: [58, 71, 49][i] })),
    promotionPipeline: { pending: 2, 'on-hold': 1, approved: 12, rejected: 3 },
    formationPipeline: { pending: 1, 'on-hold': 2, approved: 30, rejected: 4 },
    topSkills: [{ name: 'AWS', count: 18 }, { name: 'Kubernetes', count: 15 }, { name: 'Python', count: 13 }, { name: 'Terraform', count: 11 }, { name: 'React', count: 9 }, { name: 'Linux', count: 8 }],
    departments: [{ name: 'Infrastructure', count: 11 }, { name: 'Product', count: 9 }, { name: 'Data', count: 7 }, { name: 'Security', count: 4 }, { name: 'Unassigned', count: 3 }],
    trends: { enrollments: [5, 7, 4, 9, 6, 8, 11, 9], requests: [2, 1, 3, 2, 4, 2, 3, 5], certificates: [1, 3, 2, 2, 4, 3, 5, 4], users: [1, 0, 2, 1, 0, 3, 1, 2] },
    activity: [],
    queue: { promotions: [], formations: [] },
  },
})

export const promotionRequests = [
  {
    id: 4, employeeId: 7, currentPosition: 'Cloud Engineer I', requestedPosition: 'Cloud Engineer II', currentSalary: 2400, requestedSalary: 2900,
    reason: 'Led the managed Kubernetes migration.', submittedDate: '2025-05-20', status: 'approved', achievements: ['Cluster migration', 'Cut infra cost 18%'],
    certificates: [], skills: ['Kubernetes', 'AWS'],
    hrApproval: { approved: true, approvedBy: 'HR Director', approvedDate: '2025-05-24', comments: 'Solid file.' },
    managerApproval: { approved: true, approvedBy: 'Manager', approvedDate: '2025-05-30', approvedPosition: 'Cloud Engineer II', approvedSalary: 2800, approvedRating: 4.5, comments: 'Well deserved.' },
    approvedPosition: 'Cloud Engineer II', approvedSalary: 2800, approvedRating: 4.5,
  },
  {
    id: 9, employeeId: 12, currentPosition: 'Data Analyst', requestedPosition: 'Senior Data Analyst', currentSalary: 2200, requestedSalary: 2700,
    reason: 'Owns the churn model and weekly exec reporting.', submittedDate: '2026-09-18', status: 'pending', achievements: ['Churn model', 'Exec dashboard'],
    certificates: [], skills: ['SQL', 'Python'], hrApproval: null, managerApproval: null, approvedPosition: null, approvedSalary: 0, approvedRating: 0,
  },
  {
    id: 10, employeeId: 15, currentPosition: 'Frontend Developer', requestedPosition: 'Senior Frontend Developer', currentSalary: 2300, requestedSalary: 2900,
    reason: 'Rebuilt the design system and mentors two juniors.', submittedDate: '2026-09-10', status: 'on-hold', achievements: ['Design system v2'],
    certificates: [], skills: ['React', 'TypeScript'], hrApproval: { approved: true, approvedBy: 'HR Director', approvedDate: '2026-09-14', comments: 'Good for manager review.' },
    managerApproval: null, approvedPosition: null, approvedSalary: 0, approvedRating: 0,
  },
]

export const employees = [
  { id: 7, name: 'Amine Trabelsi', currentPosition: 'Cloud Engineer II', currentSalary: 2800, avatar: null, department: 'Infrastructure', experience: '4 years', performance: 4.5 },
  { id: 12, name: 'Hela Zouari', currentPosition: 'Data Analyst', currentSalary: 2200, avatar: null, department: 'Data', experience: '3 years', performance: 4.2 },
  { id: 15, name: 'Firas Ayari', currentPosition: 'Frontend Developer', currentSalary: 2300, avatar: null, department: 'Product', experience: '3 years', performance: 4.4 },
  { id: 18, name: 'Nour Gharbi', currentPosition: 'Cloud Engineer I', currentSalary: 2100, avatar: null, department: 'Infrastructure', experience: '1 year', performance: 3.9 },
  { id: 24, name: 'Rania Belhadj', currentPosition: 'DevOps Engineer', currentSalary: 2500, avatar: null, department: 'Platform', experience: '2 years', performance: 4.3 },
  { id: 25, name: 'Mehdi Chaabane', currentPosition: 'Backend Developer', currentSalary: 2400, avatar: null, department: 'Product', experience: '2 years', performance: 4.0 },
  { id: 26, name: 'Syrine Dridi', currentPosition: 'QA Engineer', currentSalary: 2000, avatar: null, department: 'Product', experience: '1 year', performance: 4.1 },
]

export const formationRequests = [
  { id: 31, formationId: 6, formationTitle: 'Secure Cloud Networking', userId: 7, employeeName: 'Amine Trabelsi', employeeAvatar: null, motivation: 'Needed for the zero-trust rollout next quarter.', status: 'on-hold', requestedAt: week(1) },
  { id: 33, formationId: 1, formationTitle: 'Kubernetes in Production', userId: 18, employeeName: 'Nour Gharbi', employeeAvatar: null, motivation: 'I am joining the platform on-call rotation.', status: 'pending', requestedAt: week(0) },
]

export const teams = [
  {
    id: 1, name: 'Infra Squad', manager: { name: 'Sarra Ben Youssef', role: 'Engineering Manager', avatar: null },
    employees: [
      { id: 11, name: 'Yassine Mejri', avatar: null, status: 'online', role: 'Senior SRE', rating: 4.8, feedback: 'Go-to person for incidents.', completedTrainings: 9, skills: ['Kubernetes', 'Prometheus'] },
      { id: 12, name: 'Amine Trabelsi', avatar: null, status: 'online', role: 'Cloud Engineer II', rating: 4.4, feedback: 'Strong ownership on the cluster migration.', completedTrainings: 6, skills: ['AWS', 'Terraform'] },
      { id: 13, name: 'Nour Gharbi', avatar: null, status: 'online', role: 'Cloud Engineer I', rating: 3.9, feedback: 'Learning fast.', completedTrainings: 2, skills: ['Linux'] },
      { id: 14, name: 'Omar Jlassi', avatar: null, status: 'away', role: 'Platform Engineer', rating: 4.2, feedback: null, completedTrainings: 5, skills: ['Terraform', 'Go'] },
      { id: 15, name: 'Ines Kallel', avatar: null, status: 'busy', tag: 'In meeting', role: 'Security Engineer', rating: 4.6, feedback: 'Great WAF work.', completedTrainings: 7, skills: ['Security'] },
    ],
  },
  {
    id: 2, name: 'Product Web', manager: { name: 'Karim Haddad', role: 'Product Lead', avatar: null },
    employees: [
      { id: 21, name: 'Firas Ayari', avatar: null, status: 'online', role: 'Frontend Developer', rating: 4.4, feedback: null, completedTrainings: 4, skills: ['React', 'TypeScript'] },
      { id: 22, name: 'Walid Saidi', avatar: null, status: 'off', role: 'DevOps Engineer', rating: 4.0, feedback: null, completedTrainings: 3, skills: ['CI/CD'] },
    ],
  },
]

// GET /api/chat-messages -> { messages: { [contactId]: [{id, text, sender, time}] } }
export const chat = {
  11: [
    { id: 1, text: 'Saw you are on the Kubernetes track — want a mock exam session Thursday?', sender: 'contact', time: '11:05' },
    { id: 2, text: 'Yes please! After stand-up works for me.', sender: 'me', time: '11:07' },
  ],
  15: [{ id: 3, text: 'The networking formation is worth it, happy to share my notes.', sender: 'contact', time: '09:30' }],
  13: [{ id: 4, text: 'Thanks for the Terraform module review 🙏', sender: 'contact', time: 'Mon' }],
}

export const autoReplies = ['Sounds good 👍', 'On it — give me 10 minutes.', 'Great, let us sync after stand-up.', 'Nice progress on the formation!', 'Can you drop the link here?']
