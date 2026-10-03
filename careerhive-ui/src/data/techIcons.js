// Real technology logos (Simple Icons, CC0) bundled locally so they render offline and inside
// strict CSPs. Formations can point at one with `iconUrl: "https://cdn.simpleicons.org/<slug>"`,
// any other image URL / base64, or nothing (then we match on title / skills / category).
import {
  siAnsible, siApachekafka, siArgo, siCloudflare, siDatadog, siDocker, siElasticsearch, siFigma, siFlutter,
  siGit, siGithub, siGithubactions, siGitlab, siGooglecloud, siGrafana, siHashicorp, siHelm, siIstio, siJavascript,
  siJenkins, siJira, siKubernetes, siLinux, siMongodb, siMysql, siNginx, siNodedotjs, siOpenstack, siOwasp, siPandas,
  siPostgresql, siPrometheus, siProxmox, siPython, siReact, siRedhat, siRedis, siSpring, siSymfony, siTensorflow, siTerraform,
  siTypescript, siVault, siVmware, siWireguard,
} from 'simple-icons'

const list = [
  siAnsible, siApachekafka, siArgo, siCloudflare, siDatadog, siDocker, siElasticsearch, siFigma, siFlutter,
  siGit, siGithub, siGithubactions, siGitlab, siGooglecloud, siGrafana, siHashicorp, siHelm, siIstio, siJavascript,
  siJenkins, siJira, siKubernetes, siLinux, siMongodb, siMysql, siNginx, siNodedotjs, siOpenstack, siOwasp, siPandas,
  siPostgresql, siPrometheus, siProxmox, siPython, siReact, siRedhat, siRedis, siSpring, siSymfony, siTensorflow, siTerraform,
  siTypescript, siVault, siVmware, siWireguard,
]
export const TECH = Object.fromEntries(list.map((i) => [i.slug, { kind: 'svg', slug: i.slug, title: i.title, hex: `#${i.hex}`, path: i.path }]))

// Topics without a logo in the set get a mark of their own.
const MARKS = {
  aws: { kind: 'text', title: 'AWS', label: 'aws', hex: '#FF9900' },
  azure: { kind: 'text', title: 'Azure', label: 'Az', hex: '#0078D4' },
  leadership: { kind: 'lucide', title: 'Leadership', name: 'Crown', hex: '#E0A82E' },
  security: { kind: 'lucide', title: 'Security', name: 'ShieldCheck', hex: '#2BB39A' },
  network: { kind: 'lucide', title: 'Networking', name: 'Network', hex: '#1F8FB8' },
  data: { kind: 'lucide', title: 'Data', name: 'Database', hex: '#6C5CE7' },
  agile: { kind: 'lucide', title: 'Agile', name: 'Repeat', hex: '#E0513B' },
  ai: { kind: 'lucide', title: 'AI', name: 'BrainCircuit', hex: '#9B5CFF' },
  default: { kind: 'lucide', title: 'Formation', name: 'GraduationCap', hex: '#C2253A' },
}

// Ordered: the first keyword that matches wins.
const RULES = [
  [/kube|k8s/i, 'kubernetes'], [/terraform|\biac\b/i, 'terraform'], [/grafana|observab/i, 'grafana'], [/prometheus/i, 'prometheus'],
  [/github actions|ci\/?cd|pipeline/i, 'githubactions'], [/docker|container/i, 'docker'], [/helm/i, 'helm'],
  [/gcp|google cloud/i, 'googlecloud'], [/\baws\b|amazon|solutions archi/i, 'aws'], [/azure/i, 'azure'],
  [/ansible/i, 'ansible'], [/jenkins/i, 'jenkins'], [/gitlab/i, 'gitlab'], [/\bgit\b/i, 'git'], [/red ?hat|\brhel\b|openshift/i, 'redhat'], [/linux/i, 'linux'],
  [/python/i, 'python'], [/pandas/i, 'pandas'], [/tensorflow|machine learn|\bml\b/i, 'tensorflow'], [/\bai\b|llm|genai/i, 'ai'],
  [/react/i, 'react'], [/typescript/i, 'typescript'], [/javascript|\bjs\b/i, 'javascript'], [/node/i, 'nodedotjs'],
  [/spring|java/i, 'spring'], [/symfony|php/i, 'symfony'], [/flutter|mobile/i, 'flutter'], [/figma|ui\/ux|design/i, 'figma'],
  [/mysql/i, 'mysql'], [/postgres/i, 'postgresql'], [/mongo/i, 'mongodb'], [/redis/i, 'redis'], [/kafka/i, 'apachekafka'],
  [/elastic/i, 'elasticsearch'], [/nginx/i, 'nginx'], [/vault|secret/i, 'vault'], [/istio|service mesh/i, 'istio'],
  [/argo|gitops/i, 'argo'], [/datadog/i, 'datadog'], [/openstack/i, 'openstack'], [/vmware|virtuali/i, 'vmware'],
  [/proxmox/i, 'proxmox'], [/wireguard|vpn/i, 'wireguard'], [/cloudflare|\bcdn\b|edge/i, 'cloudflare'], [/owasp|appsec/i, 'owasp'],
  [/secur|zero.trust|cyber/i, 'security'], [/network/i, 'network'], [/lead|manag|mentor/i, 'leadership'],
  [/jira|agile|scrum/i, 'agile'], [/data|sql|analy/i, 'data'],
]

export function techFor(text = '') {
  const hit = RULES.find(([re]) => re.test(text))
  if (!hit) return null
  return TECH[hit[1]] ?? MARKS[hit[1]]
}

/** The proper name when a skill is only another spelling of a known technology ("REACT" → "React", "redhat" → "Red Hat"). */
export function skillLabel(name = '') {
  const t = techFor(name), norm = (v) => v.toLowerCase().replace(/[^a-z0-9]/g, '')
  return t && norm(t.title) === norm(name) ? t.title : name
}

/** Resolve a formation (or any {iconUrl,title,skills,category}) to a drawable icon. */
export function resolveIcon(f = {}) {
  const url = f.iconUrl
  if (url) {
    if (url.startsWith('mark:')) return fromMark(url) ?? MARKS.default
    const m = url.match(/simpleicons\.org\/([a-z0-9]+)/i)
    if (m && TECH[m[1].toLowerCase()]) return TECH[m[1].toLowerCase()]
    if (/^(https?:|data:image)/.test(url)) return { kind: 'img', src: url, title: f.title, hex: techFor(f.title)?.hex ?? MARKS.default.hex }
  }
  return techFor(f.title) ?? techFor(Array.isArray(f.skills) ? f.skills.join(' ') : f.skills) ?? techFor(f.category) ?? MARKS.default
}

/** Icon choices for the "New formation" picker. */
export const PICKER = [...Object.values(TECH), MARKS.aws, MARKS.azure, MARKS.security, MARKS.network, MARKS.leadership, MARKS.data, MARKS.ai, MARKS.agile]
export const iconValue = (i) => (i.kind === 'svg' ? `https://cdn.simpleicons.org/${i.slug}` : `mark:${i.title}`)
export const fromMark = (v) => Object.values(MARKS).find((m) => `mark:${m.title}` === v)
