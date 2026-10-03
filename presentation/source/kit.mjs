// Graphics, social kit, mockups and video overlays — the same tokens, screens and wordmark as the book.
import fs from 'node:fs'
import path from 'node:path'
import { pageCount, pageOf } from './book.mjs'
import { brand, content, doc, fact, icon, logoTile, root, shot, tile, ver, nodeEngine, win, wordmark } from './lib.mjs'

const out = (p) => { const f = path.join(root, p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f }
const page = (p) => `../pages/page-${String(p).padStart(2, '0')}.jpg`
const frame = (id, w, h, cls, body, style = '') => `<section data-out="${id}" class="frame ${cls}" style="width:${w}px;height:${h}px;${style}">${body}</section>`
const CSS = `
  body { background: #7d8aa0; padding: 40px; display: grid; gap: 40px; justify-content: start; }
  .frame { position: relative; overflow: hidden; background: var(--paper); color: var(--ink); font-family: var(--f-body); }
  .frame.hero { background: var(--hero); color: #fff; }
  .frame.night { background: radial-gradient(120% 90% at 80% 0%, #0e2d6e 0%, var(--night) 45%, var(--night-2) 100%); color: var(--night-text); }
  .frame.ember { background: radial-gradient(110% 90% at 85% 10%, #4a1a1f 0%, var(--ember-bg) 60%); color: var(--ember-text); }
  .frame.clear { background: transparent; }
  .frame.dots::before { content: ''; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(circle, rgba(255,255,255,.28) 1.4px, transparent 1.7px); background-size: 24px 24px; -webkit-mask-image: radial-gradient(80% 70% at 85% 15%, #000, transparent 75%); mask-image: radial-gradient(80% 70% at 85% 15%, #000, transparent 75%); }
  .frame.paper.dots::before { background-image: radial-gradient(circle, rgba(47,123,246,.16) 1.4px, transparent 1.7px); }
  .frame.night.dots::before { background-image: radial-gradient(circle, rgba(143,208,255,.2) 1.4px, transparent 1.7px); }
  .kicker { font-family: var(--f-mono); font-size: 14px; letter-spacing: .24em; text-transform: uppercase; }
  .slide-no { position: absolute; z-index: 5; font-family: var(--f-mono); font-size: 16px; letter-spacing: .2em; padding: 8px 14px; border-radius: 99px; background: rgba(14,26,47,.55); color: #fff !important; backdrop-filter: blur(6px); }
  .pg { border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,.15), 0 30px 60px -20px rgba(10,20,60,.55); }
  .pg img { width: 100%; display: block; }
  .device-shadow { filter: drop-shadow(0 40px 60px rgba(10, 25, 70, .35)); }
  .clear-card { background: rgba(7, 21, 52, .78); border: 1px solid rgba(143,208,255,.25); border-radius: 26px; backdrop-filter: blur(10px); color: #fff; }
`

// ---------- shared compositions ----------
const chips = (list, cls = '') => `<div style="display:flex;gap:10px;flex-wrap:wrap">${list.map((c) => `<span class="chip ${cls}">${c}</span>`).join('')}</div>`
const stackList = [`React ${ver('react')}`, `Vite ${ver('vite')}`, `Three.js ${ver('three')}`, `Express ${ver('express')}`, 'MariaDB / MySQL', 'JWT · OAuth 2.0', 'Server-Sent Events']
const logos = [['react', 'React'], ['vite', 'Vite'], ['reactrouter', 'React Router'], ['framer', 'Framer Motion'], ['threedotjs', 'Three.js'], ['nodedotjs', 'Node.js'], ['express', 'Express'], ['jsonwebtokens', 'JWT'], ['mariadb', 'MariaDB'], ['mysql', 'MySQL'], ['gmail', 'Gmail SMTP'], ['google', 'Google OAuth'], ['github', 'GitHub OAuth'], ['linkedin', 'LinkedIn OAuth'], ['vercel', 'Vercel'], ['lucide', 'Lucide']]
const logoGrid = (cols, size = 60, dark = false) => `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:18px">${logos.map(([s, n]) => `<div style="display:flex;gap:14px;align-items:center">${logoTile({ slug: s, size })}<span style="font-weight:600;font-size:${Math.round(size * 0.3)}px;color:${dark ? '#fff' : 'var(--ink)'}">${n}</span></div>`).join('')}</div>`

/** A compact architecture diagram designed at 1200×560; scale it with `k`. */
const arch = (k = 1) => `<div style="width:1200px;height:560px;position:relative;transform:scale(${k});transform-origin:0 0;color:#fff">
  ${[[0, 'Monitor', 'Browser', 'React SPA · Vite', ['React Router', 'Framer Motion', 'Three.js / R3F', 'Recharts']],
    [410, 'Server', `Express ${ver('express')} API`, `Node.js ${nodeEngine.replace('>=', '≥ ')} · 70 handlers`, ['JWT auth · roles from DB', 'Rate limit · CORS', 'Multer uploads', 'SSE hub']]]
    .map(([x, ic, t, s, list]) => `<div class="card" style="position:absolute;left:${x}px;top:40px;width:340px;height:480px;padding:26px;background:rgba(255,255,255,.05);border-color:rgba(143,208,255,.2)">
      <div style="display:flex;gap:14px;align-items:center">${tile(ic, { size: 52, tone: 'sky' })}<div><div class="h4" style="color:#fff">${t}</div><div style="font-size:14px;color:var(--night-dim);margin-top:2px">${s}</div></div></div>
      <div style="display:grid;gap:12px;margin-top:28px">${list.map((l) => `<div style="padding:12px 14px;border-radius:14px;border:1px solid rgba(143,208,255,.2);font-size:16px">${l}</div>`).join('')}</div></div>`).join('')}
  ${[[40, 'mariadb', 'MariaDB / MySQL', '23 tables'], [160, null, 'Upload storage', '/uploads, random names', 'HardDrive'], [280, 'gmail', 'Gmail SMTP', 'confirmation & reset'], [400, null, 'OAuth 2.0', 'Google · LinkedIn · GitHub', 'KeyRound']]
    .map(([y, slug, t, s, ic]) => `<div class="card" style="position:absolute;left:840px;top:${y}px;width:360px;height:100px;padding:20px 22px;display:flex;gap:14px;align-items:center;background:rgba(255,255,255,.05);border-color:rgba(143,208,255,.2)">${slug ? logoTile({ slug, size: 50 }) : tile(ic, { size: 50, tone: 'sky' })}<div><div style="font-weight:700;font-size:19px">${t}</div><div style="font-size:14px;color:var(--night-dim)">${s}</div></div></div>`).join('')}
  <svg style="position:absolute;inset:0" width="1200" height="560"><defs><marker id="a${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5fb2ff"/></marker></defs>
    <path d="M340 240 H406" stroke="#5fb2ff" stroke-width="2.5" marker-end="url(#a${k})"/><path d="M410 330 H344" stroke="#8fd0ff" stroke-width="2.5" stroke-dasharray="6 6" marker-end="url(#a${k})"/>
    ${[90, 210, 330, 450].map((y) => `<path d="M750 ${Math.min(Math.max(y, 140), 430)} C 790 ${Math.min(Math.max(y, 140), 430)}, 800 ${y}, 836 ${y}" fill="none" stroke="#5fb2ff" stroke-width="2" marker-end="url(#a${k})"/>`).join('')}</svg>
  <div style="position:absolute;left:346px;top:204px;font-family:var(--f-mono);font-size:11px;letter-spacing:.1em">JSON · JWT</div>
  <div style="position:absolute;left:350px;top:340px;font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;color:#8fd0ff">SSE PUSH</div>
</div>`

const pathDiagram = (dark = false) => `<div class="path" style="width:100%">${[['GraduationCap', 'Learn', ''], ['Award', 'Prove', 'violet'], ['TrendingUp', 'Grow', 'good']].map(([ic, t, tone]) => `<div class="step">${tile(ic, { size: 72, tone })}<div class="h3" style="font-size:34px;color:${dark ? '#fff' : 'var(--ink)'}">${t}</div></div>`).join('')}</div>`
const persp = (items, rot = 'rotateY(-18deg) rotateX(6deg)') => `<div style="position:absolute;inset:0;perspective:2400px"><div style="position:absolute;inset:0;transform:${rot};transform-style:preserve-3d">${items}</div></div>`

// ---------- social kit ----------
function social() {
  const f = []
  // LinkedIn — announcement 1200×627
  f.push(frame('social/linkedin/01-announcement.png', 1200, 627, 'hero dots', `
    <div class="glow" style="width:700px;height:700px;right:-160px;top:-300px;background:rgba(255,255,255,.22)"></div>
    <div style="position:absolute;left:64px;top:62px;width:500px;z-index:2">
      <div class="kicker" style="color:rgba(255,255,255,.85)">New project · case study</div>
      <div style="margin-top:26px">${wordmark(104, '#fff')}</div>
      <div class="h2" style="margin-top:26px;color:#fff;font-size:46px">Grow on purpose.</div>
      <p style="margin-top:16px;font-size:19px;line-height:1.45;color:rgba(255,255,255,.88);max-width:470px">Formations, promotions, two-stage reviews, a CV coach, live chat and a feed — one workspace for the people growing and the people deciding.</p>
      <div style="margin-top:26px">${chips(stackList.slice(0, 5))}</div>
    </div>
    <div style="position:absolute;left:660px;top:40px;width:640px;height:620px">${persp(`<div style="position:absolute;left:40px;top:20px;transform:translateZ(-80px)">${win('org-panel', { route: '/', width: 560 })}</div><div style="position:absolute;left:0;top:250px;transform:translateZ(40px)">${win('feed', { route: '/feed', width: 520 })}</div>`)}</div>`))

  // LinkedIn — carousel 1080×1350
  const slide = (n, cls, body) => frame(`social/linkedin/carousel-${n}.png`, 1080, 1350, cls, `${body}<div class="slide-no" style="right:64px;bottom:56px;color:${cls.includes('paper') ? 'var(--mist)' : 'rgba(255,255,255,.7)'}">${n} / 5</div>`)
  f.push(slide(1, 'hero dots', `
    <div style="position:absolute;left:72px;top:96px;right:72px">
      <div class="kicker" style="color:rgba(255,255,255,.85)">Case study</div>
      <div style="margin-top:30px">${wordmark(150, '#fff')}</div>
      <div class="h1" style="margin-top:34px;color:#fff;font-size:76px">Grow on purpose.</div>
      <p style="margin-top:24px;font-size:28px;line-height:1.45;color:rgba(255,255,255,.88)">A career-growth workspace: learn, prove your progress, ask for your next role.</p>
    </div>
    <div style="position:absolute;left:72px;right:-120px;top:720px">${win('formations-catalog', { route: '/formations', width: 1040 })}</div>
    <div class="slide-no" style="left:72px;bottom:56px;color:#fff">Swipe →</div>`))
  f.push(slide(2, 'ember', `
    <div style="position:absolute;left:72px;top:100px;right:72px">
      <div class="kicker" style="color:var(--ember-2)">The problem</div>
      <div class="h1" style="margin-top:28px;font-size:92px;color:#fff">Growth gets lost between <span class="grad-ember">tools.</span></div>
      <div style="display:grid;gap:18px;margin-top:48px">${[['FileSpreadsheet', 'Training in spreadsheets'], ['CircleHelp', 'Promotions as a black box'], ['Mails', 'Approvals by email']].map(([ic, t]) => `<div style="display:flex;gap:18px;align-items:center">${tile(ic, { size: 56, tone: 'ember', soft: true })}<span style="font-size:30px;font-weight:600">${t}</span></div>`).join('')}</div>
    </div>
    <div class="card" style="position:absolute;left:72px;right:72px;bottom:130px;padding:40px;background:#fff;color:var(--ink);border:0">
      <div class="kicker" style="color:var(--blue)">CareerHive puts it on one path</div>
      <div style="margin-top:34px">${pathDiagram()}</div>
    </div>`))
  f.push(slide(3, 'paper dots', `
    <div style="position:absolute;left:72px;top:100px;right:72px">
      <div class="kicker" style="color:var(--blue)">What’s inside</div>
      <div class="h1" style="margin-top:26px;font-size:84px">Nine features, one workflow.</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px">${[['TrendingUp', 'Promotion requests', 'good'], ['GraduationCap', 'Formations & content', ''], ['ClipboardCheck', 'Two-stage reviews', 'warn'], ['ChartColumn', 'Skills & analytics', 'violet'], ['Compass', 'CV coach', 'violet'], ['MessagesSquare', 'Team chat', 'sky'], ['Bell', 'Live notifications', 'indigo'], ['Newspaper', 'Feed & profiles', 'bad'], ['UserCog', 'Accounts & roles', 'ink']].map(([ic, t, tone]) => `<div class="card" style="padding:18px 18px;display:flex;gap:14px;align-items:center">${tile(ic, { size: 46, tone })}<span style="font-size:20px;font-weight:650;line-height:1.2">${t}</span></div>`).join('')}</div>
    </div>
    <div style="position:absolute;left:72px;right:72px;top:700px">${win('reviews', { route: '/reviews', width: 936, region: [300, 60, 1000, 480] })}</div>`))
  f.push(slide(4, 'night dots', `
    <div style="position:absolute;left:72px;top:100px;right:72px">
      <div class="kicker" style="color:var(--sky)">Architecture</div>
      <div class="h1" style="margin-top:26px;font-size:84px;color:#fff">How the pieces talk.</div>
      <p style="margin-top:22px;font-size:26px;line-height:1.45;color:var(--night-dim)">A React SPA talks JSON with a JWT; the server pushes notifications back over Server-Sent Events.</p>
    </div>
    <div style="position:absolute;left:72px;top:560px">${arch(0.78)}</div>`))
  f.push(slide(5, 'paper dots', `
    <div style="position:absolute;left:72px;top:100px;right:72px">
      <div class="kicker" style="color:var(--blue)">Built with</div>
      <div class="h1" style="margin-top:26px;font-size:84px">The stack.</div>
      <div style="margin-top:56px">${logoGrid(2, 84)}</div>
    </div>
    <div class="card" style="position:absolute;left:72px;right:72px;bottom:120px;padding:30px 34px;background:var(--ink);color:#fff;border:0">
      <div class="h3" style="color:#fff">${content.github ? 'Read the full case study' : 'Building something like this?'}</div>
      <div style="margin-top:12px;font-size:20px;color:#b9c8e2">${content.github ? `${pageCount()}-page project book · GitHub: ${fact('github')}` : `Message me on LinkedIn · ${pageCount()}-page case study on request`}</div>
    </div>`))

  // LinkedIn — showcase, architecture, stack, final result (1200×627)
  f.push(frame('social/linkedin/06-cv-coach.png', 1200, 627, 'paper dots', `
    <div style="position:absolute;left:64px;top:62px;width:470px">
      <div class="kicker" style="color:var(--violet)">New in CareerHive · CV coach</div>
      <div class="h2" style="margin-top:20px;font-size:50px;line-height:1.02">Let your CV find your <span class="grad">next step.</span></div>
      <p style="margin-top:18px;font-size:19px;line-height:1.5;color:var(--slate)">Upload a CV: CareerHive reads your skills, ranks this company’s formations by the gaps they fill and finds the manager to learn from.</p>
      <div style="margin-top:22px">${chips(['PDF · Word · text', 'Never stored', 'Explained matches'], 'soft')}</div>
    </div>
    <div style="position:absolute;left:575px;top:52px;transform:rotate(1deg)">${win('cv-results', { route: '/profile · career compass', width: 580, region: [300, 90, 1140, 700] })}</div>
    <div style="position:absolute;left:940px;top:262px;transform:rotate(-2.5deg)">${win('cv-loading', { route: 'analysing', width: 220, region: [461, 144, 518, 610] })}</div>`))
  f.push(frame('social/linkedin/02-showcase.png', 1200, 627, 'night dots', `
    <div class="glow" style="width:800px;height:500px;left:300px;top:200px;background:rgba(47,123,246,.5)"></div>
    <div style="position:absolute;left:60px;top:56px"><div class="kicker" style="color:var(--sky)">Showcase</div><div class="h2" style="margin-top:14px;color:#fff;font-size:48px">Frost, by default.</div></div>
    <div style="position:absolute;left:250px;top:190px;width:900px;perspective:2200px"><div style="transform:rotateX(16deg);transform-origin:50% 0">${win('org-panel', { route: '/', width: 900 })}</div></div>`))
  f.push(frame('social/linkedin/03-architecture.png', 1200, 627, 'night', `
    <div style="position:absolute;left:60px;top:48px"><div class="kicker" style="color:var(--sky)">System architecture</div><div class="h3" style="margin-top:10px;color:#fff;font-size:34px">React SPA → Express API → MariaDB, with live push</div></div>
    <div style="position:absolute;left:60px;top:150px">${arch(0.9)}</div>`))
  f.push(frame('social/linkedin/04-tech-stack.png', 1200, 627, 'paper dots', `
    <div style="position:absolute;left:60px;top:52px"><div class="kicker" style="color:var(--blue)">Technology stack</div><div class="h2" style="margin-top:12px;font-size:50px">The ecosystem.</div></div>
    <div style="position:absolute;left:60px;right:60px;top:210px">${logoGrid(4, 58)}</div>`))
  f.push(frame('social/linkedin/05-final-result.png', 1200, 627, 'paper dots', `
    <div style="position:absolute;left:60px;top:52px"><div class="kicker" style="color:var(--blue)">Final result</div><div class="h2" style="margin-top:12px;font-size:50px">One app, three moods.</div></div>
    ${[['dashboard-employee-ember', 60, 250, 480, 1], ['dashboard-employee-light', 660, 250, 480, 1], ['dashboard-employee', 300, 190, 600, 2]].map(([s, x, y, w, z]) => `<div style="position:absolute;left:${x}px;top:${y}px;z-index:${z}">${win(s, { route: '/', width: w })}</div>`).join('')}`))

  // Instagram — square, portrait, story
  f.push(frame('social/instagram/square-1080.png', 1080, 1080, 'hero dots', `
    <div style="position:absolute;left:80px;top:90px;right:80px">${wordmark(136, '#fff')}<div class="h1" style="margin-top:28px;color:#fff;font-size:68px">Grow on purpose.</div></div>
    <div style="position:absolute;left:80px;right:-60px;top:470px">${persp(`<div style="position:absolute;left:0;top:0">${win('feed', { route: '/feed', width: 980 })}</div>`, 'rotateY(-10deg) rotateX(8deg)')}</div>`))
  f.push(frame('social/instagram/portrait-1080x1350.png', 1080, 1350, 'paper dots', `
    <div style="position:absolute;left:80px;top:90px;right:80px"><div class="kicker" style="color:var(--blue)">CareerHive · themes</div><div class="h1" style="margin-top:22px;font-size:88px">One app,<br>three moods.</div></div>
    ${[['dashboard-employee-ember', 80, 520, 760], ['dashboard-employee-light', 240, 700, 760], ['dashboard-employee', 160, 880, 760]].map(([s, x, y, w]) => `<div style="position:absolute;left:${x}px;top:${y}px">${win(s, { route: '/', width: w })}</div>`).join('')}`))
  f.push(frame('social/instagram/story-1080x1920.png', 1080, 1920, 'hero dots', `
    <div class="glow" style="width:900px;height:900px;left:90px;top:620px;background:rgba(255,255,255,.18)"></div>
    <div style="position:absolute;left:90px;top:170px;right:90px;text-align:center">${wordmark(150, '#fff')}<div class="h1" style="margin-top:30px;color:#fff;font-size:76px">Grow on purpose.</div></div>
    <div style="position:absolute;left:315px;top:560px;width:450px;padding:14px;border-radius:64px;background:#0e1a2f" class="device-shadow"><div style="border-radius:52px;overflow:hidden;height:900px"><img src="${shot('dashboard-mobile')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div></div>
    <div style="position:absolute;left:90px;right:90px;bottom:170px;text-align:center"><p style="font-size:34px;line-height:1.4;color:rgba(255,255,255,.9)">Formations, promotions, reviews, a CV coach, chat and a feed — one workspace.</p><div style="margin-top:34px;display:inline-block;padding:18px 34px;border-radius:99px;background:#fff;color:var(--blue);font-weight:700;font-size:30px">Case study →</div></div>`))

  // GitHub — README hero, banner, feature graphics, architecture
  f.push(frame('social/github/readme-hero-1280x640.png', 1280, 640, 'paper dots', `
    <div style="position:absolute;left:70px;top:88px;width:520px">${wordmark(104)}<div class="h2" style="margin-top:22px;font-size:46px">Grow on purpose.</div>
      <p style="margin-top:16px;font-size:20px;line-height:1.5;color:var(--slate)">A career-growth workspace: formations, promotion requests, two-stage reviews, a CV coach, live notifications, chat and a feed.</p>
      <div style="margin-top:26px">${chips(stackList.slice(0, 6), 'soft')}</div></div>
    <div style="position:absolute;left:640px;top:70px">${win('org-panel', { route: '/', width: 720 })}</div>`))
  f.push(frame('social/github/banner-1600x400.png', 1600, 400, 'hero dots', `
    <div style="position:absolute;left:80px;top:96px">${wordmark(120, '#fff')}<div style="margin-top:22px;font-size:30px;color:rgba(255,255,255,.9);font-family:var(--f-display);font-weight:700">Grow on purpose.</div></div>
    <div style="position:absolute;right:80px;top:120px;width:640px">${chips(stackList)}</div>`))
  const featureCard = (id, ic, tone, title, sub, body) => frame(`social/github/feature-${id}.png`, 800, 450, 'paper dots', `
    <div style="position:absolute;left:44px;top:40px;display:flex;gap:16px;align-items:center">${tile(ic, { size: 56, tone })}<div><div class="h3" style="font-size:30px">${title}</div><div style="font-size:16px;color:var(--slate);margin-top:4px">${sub}</div></div></div>${body}`)
  f.push(featureCard('workflow', 'Workflow', 'good', 'Two-stage reviews', 'pending → HR → manager → approved', `
    <div style="position:absolute;left:44px;right:44px;top:190px"><div class="path">${[['Send', 'Submitted', ''], ['ClipboardCheck', 'HR review', 'warn'], ['UserCheck', 'Manager', 'sky'], ['CircleCheck', 'Approved', 'good']].map(([ic, t, tone]) => `<div class="step">${tile(ic, { size: 64, tone })}<div style="font-weight:700;font-size:20px">${t}</div></div>`).join('')}</div>
    <div style="margin-top:36px;font-size:17px;color:var(--slate);text-align:center">Approval writes the new position and salary to the profile · every step notifies</div></div>`))
  f.push(featureCard('live-notifications', 'Radio', 'sky', 'Live notifications', 'Server-Sent Events + polling fallback', `<div style="position:absolute;left:44px;right:44px;top:150px">${win('notifications', { route: '/ · notifications', width: 712, region: [900, 100, 560, 200] })}</div>`))
  f.push(featureCard('cv-coach', 'Compass', 'violet', 'CV coach', 'Reads a CV · best formations · the manager who fits', `<div style="position:absolute;left:44px;right:44px;top:150px">${win('cv-results', { route: '/profile · career compass', width: 712, region: [300, 90, 1140, 470] })}</div>`))
  f.push(featureCard('feed', 'Newspaper', 'bad', 'Feed & profiles', 'Posts with images, likes, comments, follows', `<div style="position:absolute;left:44px;right:44px;top:150px">${win('feed', { route: '/feed', width: 712, region: [300, 80, 1000, 420] })}</div>`))
  f.push(frame('social/github/architecture-1600x900.png', 1600, 900, 'night dots', `
    <div style="position:absolute;left:80px;top:70px"><div class="kicker" style="color:var(--sky)">CareerHive · system architecture</div><div class="h2" style="margin-top:14px;color:#fff;font-size:56px">How the pieces talk.</div></div>
    <div style="position:absolute;left:140px;top:230px">${arch(1.1)}</div>`))

  // Portfolio — thumbnail, hero, case-study preview, technology graphic
  f.push(frame('social/portfolio/thumbnail-800x600.png', 800, 600, 'hero dots', `
    <div style="position:absolute;left:50px;top:50px">${wordmark(70, '#fff')}<div style="margin-top:12px;font-size:20px;color:rgba(255,255,255,.9);font-weight:600">Grow on purpose.</div></div>
    <div style="position:absolute;left:50px;right:-80px;top:190px">${persp(`<div style="position:absolute;left:0;top:0">${win('formations-catalog', { route: '/formations', width: 760 })}</div>`, 'rotateY(-12deg) rotateX(6deg)')}</div>`))
  f.push(frame('social/portfolio/hero-1200x630.png', 1200, 630, 'hero dots', `
    <div style="position:absolute;left:64px;top:70px;width:520px"><div class="kicker" style="color:rgba(255,255,255,.85)">Full-stack product · ${fact('year')}</div><div style="margin-top:22px">${wordmark(96, '#fff')}</div><div class="h2" style="margin-top:22px;color:#fff;font-size:42px">Grow on purpose.</div>
      <p style="margin-top:14px;font-size:19px;line-height:1.5;color:rgba(255,255,255,.88)">React · Express · MySQL · SSE · OAuth · Three.js</p></div>
    <div style="position:absolute;left:580px;top:70px;width:700px;height:600px">${persp(`<div style="position:absolute;left:0;top:0;transform:translateZ(-60px)">${win('formations-catalog', { route: '/formations', width: 600 })}</div><div style="position:absolute;left:120px;top:250px;transform:translateZ(60px)">${win('formation-drawer', { route: '/formations', width: 480, region: [850, 10, 580, 380] })}</div>`)}</div>`))
  f.push(frame('social/portfolio/case-study-preview-1600x1000.png', 1600, 1000, 'paper dots', `
    <div style="position:absolute;left:80px;top:80px"><div class="kicker" style="color:var(--blue)">Case study · ${pageCount()} pages</div><div class="h1" style="margin-top:18px;font-size:72px">The CareerHive<br>project book.</div></div>
    <div style="position:absolute;left:80px;top:390px;width:860px" class="pg"><img src="${page(1)}"></div>
    <div style="position:absolute;left:980px;top:160px;width:520px;display:grid;gap:22px">${[15, 19, 27].map((p) => `<div class="pg"><img src="${page(p)}"></div>`).join('')}</div>`))
  f.push(frame('social/portfolio/technology-1600x900.png', 1600, 900, 'paper dots', `
    <div style="position:absolute;left:80px;top:70px"><div class="kicker" style="color:var(--blue)">Technology</div><div class="h1" style="margin-top:16px;font-size:72px">Built with.</div></div>
    <div style="position:absolute;left:80px;right:80px;top:280px">${logoGrid(4, 96)}</div>
    <div style="position:absolute;left:80px;bottom:70px;font-family:var(--f-mono);font-size:14px;letter-spacing:.14em;color:var(--mist);text-transform:uppercase">No AI service · versions from package.json</div>`))
  return f
}

// ---------- mockups ----------
function mockups() {
  const f = []
  const floor = (id, cls, body) => frame(`mockups/${id}.png`, 1600, 1000, cls, body)
  // A — the cover as a premium document
  f.push(floor('A-cover-document', 'paper', `
    <div style="position:absolute;inset:0;background:radial-gradient(70% 70% at 50% 40%, #ffffff, #dfe7f3 80%)"></div>
    <div style="position:absolute;left:250px;top:170px;width:1100px;perspective:3000px"><div style="transform:rotateX(18deg) rotateZ(-4deg);transform-style:preserve-3d">
      ${[3, 2].map((p, i) => `<div class="pg" style="position:absolute;left:${30 - i * 14}px;top:${26 - i * 12}px;width:1100px;opacity:.95"><img src="${page(p)}"></div>`).join('')}
      <div class="pg" style="position:relative;width:1100px;box-shadow:0 2px 4px rgba(0,0,0,.2), 0 60px 90px -30px rgba(15,35,90,.6)"><img src="${page(1)}"></div>
    </div></div>
    <div style="position:absolute;left:0;right:0;bottom:60px;text-align:center" class="kicker">CareerHive · project book · ${pageCount()} pages · 16:9</div>`))
  // B — pages floating in perspective
  f.push(floor('B-floating-pages', 'night', `
    <div class="glow" style="width:900px;height:700px;left:350px;top:150px;background:rgba(47,123,246,.45)"></div>
    <div style="position:absolute;inset:0;perspective:2400px"><div style="position:absolute;left:120px;top:130px;transform:rotateX(28deg) rotateZ(-14deg);transform-style:preserve-3d;display:grid;grid-template-columns:repeat(3,480px);gap:34px">
      ${[1, 15, 7, 19, 21, 27].map((p, i) => `<div class="pg" style="transform:translateZ(${[60, 0, 40, 20, 80, 10][i]}px)"><img src="${page(p)}"></div>`).join('')}
    </div></div>`))
  // C — laptop + phone + PDF
  f.push(floor('C-laptop-phone-pdf', 'paper', `
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,#eef3fa,#d6e0ee)"></div>
    <div style="position:absolute;left:140px;top:170px;width:980px" class="device-shadow">
      <div style="background:#0e1a2f;border-radius:30px 30px 10px 10px;padding:18px 18px 22px"><div style="border-radius:12px;overflow:hidden;aspect-ratio:16/10"><img src="${shot('formations-catalog')}" style="width:100%;height:100%;object-fit:cover"></div></div>
      <div style="height:26px;margin:0 -70px;background:linear-gradient(#e6ebf2,#b9c3d1);border-radius:0 0 26px 26px;position:relative"><div style="position:absolute;left:50%;top:0;width:160px;height:10px;margin-left:-80px;background:#aab4c3;border-radius:0 0 10px 10px"></div></div>
    </div>
    <div style="position:absolute;left:1030px;top:350px;width:250px;padding:10px;border-radius:40px;background:#0e1a2f" class="device-shadow"><div style="border-radius:31px;overflow:hidden;height:520px"><img src="${shot('feed-mobile')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div></div>
    <div style="position:absolute;left:1180px;top:130px;width:360px;transform:rotate(6deg)" class="pg"><img src="${page(1)}"></div>`))
  // D — magazine spread
  f.push(floor('D-magazine-spread', 'paper', `
    <div style="position:absolute;inset:0;background:radial-gradient(80% 80% at 50% 30%, #f7f9fc, #cfd9e8)"></div>
    <div style="position:absolute;left:110px;top:230px;width:1380px;perspective:3000px"><div style="display:grid;grid-template-columns:1fr 1fr;transform:rotateX(22deg);box-shadow:0 70px 100px -40px rgba(15,35,90,.55)">
      <div style="position:relative"><img src="${page(pageOf('06 · Architecture'))}" style="width:100%;display:block"><div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent 80%,rgba(0,0,0,.28))"></div></div>
      <div style="position:relative"><img src="${page(pageOf('07 · Technology stack'))}" style="width:100%;display:block"><div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.18),transparent 20%)"></div></div>
    </div></div>
    <div style="position:absolute;left:0;right:0;bottom:70px;text-align:center" class="kicker">Architecture &amp; stack spread</div>`))
  // E — social card (generic, not a platform's UI)
  f.push(floor('E-social-card', 'paper', `
    <div style="position:absolute;inset:0;background:linear-gradient(135deg,#dfe7f3,#eef3fa)"></div>
    <div class="card" style="position:absolute;left:400px;top:70px;width:800px;padding:0;overflow:hidden;box-shadow:var(--elev-lg)">
      <div style="display:flex;gap:16px;align-items:center;padding:24px 28px">
        <div style="width:58px;height:58px;border-radius:50%;background:var(--hero);display:grid;place-items:center;color:#fff;font-family:var(--f-display);font-weight:800;font-size:22px">${(content.author || 'MH').split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
        <div><div style="font-weight:700;font-size:20px">${fact('author')}</div><div style="font-size:15px;color:var(--slate)">Full-stack developer · ${fact('year')}</div></div></div>
      <p style="padding:0 28px 20px;font-size:18px;line-height:1.55">I built <b>CareerHive</b> — a career-growth workspace: formations, promotion requests with two-stage reviews, a CV coach, live notifications and a feed. React ${ver('react')} · Express ${ver('express')} · MySQL. Case study below 👇</p>
      <img src="../social/linkedin/01-announcement.png" style="width:100%;display:block">
      <div style="display:flex;gap:28px;padding:18px 28px;color:var(--slate);font-size:16px;font-weight:600">${[['Heart', 'Like'], ['MessageCircle', 'Comment'], ['Repeat2', 'Share']].map(([ic, t]) => `<span style="display:flex;gap:8px;align-items:center">${icon(ic, 20)}${t}</span>`).join('')}</div>
    </div>`))
  return f
}

// ---------- video overlays (transparent 1920×1080) ----------
function overlays() {
  const f = []
  const o = (id, body) => frame(`video/overlays/${id}.png`, 1920, 1080, 'clear', body)
  f.push(o('01-title', `<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div>${wordmark(220, '#fff')}<div class="h1" style="margin-top:40px;color:#fff;font-size:84px;text-shadow:0 10px 40px rgba(10,30,90,.5)">Grow on purpose.</div></div></div>`))
  const lower = (id, ic, tone, t, s) => o(id, `<div class="clear-card" style="position:absolute;left:96px;bottom:96px;padding:26px 34px;display:flex;gap:20px;align-items:center">${tile(ic, { size: 64, tone })}<div><div class="h3" style="color:#fff;font-size:36px">${t}</div><div style="font-size:21px;color:#b9d4ff;margin-top:4px">${s}</div></div></div>`)
  f.push(lower('02-lower-promotions', 'TrendingUp', 'good', 'Promotion requests', 'Gated by real rules · HR, then manager'))
  f.push(lower('03-lower-formations', 'GraduationCap', '', 'Formations & course content', 'Videos, files, links — progress follows'))
  f.push(lower('04-lower-reviews', 'ClipboardCheck', 'warn', 'Two-stage reviews', 'HR forwards · the manager decides'))
  f.push(lower('05-lower-chat', 'MessagesSquare', 'sky', 'Team hub', 'Chat between accounts · live presence'))
  f.push(lower('06-lower-notifications', 'Radio', 'indigo', 'Live notifications', 'Server-Sent Events'))
  f.push(lower('07-lower-feed', 'Newspaper', 'bad', 'Feed & profiles', 'Posts, images, likes, comments, follows'))
  const label = (id, k, t) => o(id, `<div style="position:absolute;left:96px;top:96px"><div class="kicker" style="color:#8fd0ff;font-size:22px">${k}</div><div class="h1" style="margin-top:20px;color:#fff;font-size:110px;text-shadow:0 10px 40px rgba(10,30,90,.5)">${t}</div></div>`)
  f.push(label('08-problem', 'The problem', 'Growth gets lost<br>between tools.'))
  f.push(label('09-solution', 'The solution', 'One clear path.'))
  f.push(o('10-architecture', `<div class="clear-card" style="position:absolute;left:260px;top:210px;padding:40px"><div style="width:1320px;height:616px">${arch(1.1)}</div></div>`))
  f.push(o('11-stack-strip', `<div class="clear-card" style="position:absolute;left:96px;right:96px;bottom:96px;padding:26px 34px;display:flex;gap:26px;align-items:center;justify-content:center">${logos.slice(0, 11).map(([s]) => logoTile({ slug: s, size: 64 })).join('')}</div>`))
  f.push(o('12-end-card', `<div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div>${wordmark(170, '#fff')}<div class="h2" style="margin-top:34px;color:#fff;font-size:64px">Grow on purpose.</div>
    <div style="margin-top:44px;display:flex;gap:22px;justify-content:center">${[['GitHub', 'github', 'repository URL'], ['Live demo', 'demo', 'live URL']].map(([l, k, w]) => `<div class="clear-card" style="padding:18px 28px;font-size:22px"><span style="color:#8fd0ff;font-family:var(--f-mono);font-size:15px;letter-spacing:.14em;text-transform:uppercase">${l}</span><div style="margin-top:6px">${fact(k, w)}</div></div>`).join('')}</div></div></div>`))
  return f
}

// ---------- graphics: diagram pages from the book, at 2× ----------
// each graphic is a book page, found by its section (and which page of it)
const GRAPHICS = [['01 · Project DNA', 0, 'project-dna'], ['02 · The problem', 0, 'problem'], ['03 · The solution', 0, 'problem-to-solution'], ['04 · Features', 0, 'feature-map'],
  ['05 · User experience', 0, 'user-journey'], ['06 · Architecture', 0, 'architecture'], ['07 · Technology stack', 0, 'technology-stack'], ['08 · Technical highlights', 0, 'auth-flow'],
  ['08 · Technical highlights', 1, 'platform-highlights'], ['09 · Data model', 0, 'data-model'], ['10 · UI / UX design', 0, 'design-system'], ['10 · UI / UX design', 1, 'annotated-dashboard'],
  ['12 · Project journey', 0, 'project-timeline'], ['14 · Quality & performance', 0, 'quality-metrics'], ['15 · Security', 0, 'security']]

export async function run({ want, openHtml, browser }) {
  if (want('graphics')) {
    const p = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
    await p.goto('file:///' + path.join(root, 'source/book.html').replace(/\\/g, '/'), { waitUntil: 'networkidle' })
    await p.evaluate(() => document.fonts.ready)
    for (const [section, nth, name] of GRAPHICS) await p.locator(`#p${pageOf(section, nth)}`).screenshot({ path: out(`graphics/${name}.png`) })
    await p.close()
    console.log(`graphics: ${GRAPHICS.length} files`)
  }
  const sets = [['social', social, 1, false], ['mockups', mockups, 2, false], ['overlays', overlays, 1, true]]
  for (const [key, make, dpr, transparent] of sets) {
    if (!want(key)) continue
    const frames = make()
    const page = await openHtml(`${key}.html`, doc(`CareerHive — ${key}`, frames, CSS + (transparent ? 'html,body{background:transparent!important}' : '')), { width: 2000, height: 1200 })
    await page.close()
    const p = await browser.newPage({ viewport: { width: 2000, height: 1200 }, deviceScaleFactor: dpr })
    await p.goto('file:///' + path.join(root, `source/${key}.html`).replace(/\\/g, '/'), { waitUntil: 'networkidle' })
    await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))) })
    const ids = await p.$$eval('[data-out]', (els) => els.map((e) => e.dataset.out))
    for (const id of ids) await p.locator(`[data-out="${id}"]`).screenshot({ path: out(id), omitBackground: transparent })
    await p.close()
    console.log(`${key}: ${ids.length} files`)
  }
  if (want('social')) {
    const slides = [1, 2, 3, 4, 5].map((n) => `<img src="data:image/png;base64,${fs.readFileSync(out(`social/linkedin/carousel-${n}.png`)).toString('base64')}">`).join('')
    const p = await browser.newPage()
    await p.setContent(`<html><head><style>@page { size: 1080px 1350px; margin: 0 } body { margin: 0 } img { display: block; width: 1080px; height: 1350px } img + img { break-before: page }</style></head><body>${slides}</body></html>`, { waitUntil: 'load' })
    await p.pdf({ path: out('social/linkedin/CareerHive-carousel.pdf'), width: '1080px', height: '1350px', printBackground: true })
    await p.close()
    console.log('social: carousel PDF')
  }
}
