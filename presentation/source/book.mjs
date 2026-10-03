// The CareerHive project book: 34 pages at 1920×1080. Every fact here comes from the code (see ../PLAN.md);
// anything unknown is printed as [INFORMATION NEEDED].
import { brand, content, fact, icon, logoTile, need, page, shot, tile, ver, nodeEngine, win, wordmark } from './lib.mjs'

// ---------- small building blocks ----------
const eyebrow = (t, style = '') => `<div class="eyebrow" style="${style}">${t}</div>`
const ticks = (items, style = '') => `<ul class="ticks" style="${style}">${items.map((i) => `<li><span>${i}</span></li>`).join('')}</ul>`
const labelled = (label, value, style = '') => `<div style="${style}"><div class="mono" style="margin-bottom:10px">${label}</div><div style="font-size:22px;font-weight:600">${value}</div></div>`

/** A feature story: text on the left, the real screens on the right. */
function feature({ idx, title, icon: ic, tone = '', purpose, benefit, how, main, mainRoute, second, secondRoute, region, at = [1290, 640], w = 520 }) {
  return `<div class="inner dots">
    <div style="position:absolute;left:120px;top:150px;width:560px">
      ${eyebrow(`04 — Features · ${String(idx).padStart(2, '0')}/07`)}
      <div style="display:flex;gap:22px;align-items:center;margin-top:30px">${tile(ic, { size: 76, tone })}<h2 class="h2" style="font-size:54px">${title}</h2></div>
      <p class="lead" style="margin-top:30px;font-size:26px">${purpose}</p>
      <div class="card" style="margin-top:32px;padding:26px 28px;display:flex;gap:18px;align-items:flex-start">
        ${tile('Sparkles', { size: 44, tone: 'violet', soft: true })}
        <div><div class="mono" style="color:var(--violet)">Why it matters</div><div style="font-size:20px;line-height:1.5;margin-top:8px;color:var(--ink)">${benefit}</div></div>
      </div>
      <div class="mono" style="margin:34px 0 16px">How it works</div>
      ${ticks(how)}
    </div>
    <div style="position:absolute;left:740px;top:150px">${win(main, { route: mainRoute, width: 1060 })}</div>
    ${second ? `<div style="position:absolute;left:${at[0]}px;top:${at[1]}px;transform:rotate(-1.2deg)">${win(second, { route: secondRoute, width: w, region })}</div>` : ''}
  </div>`
}

/** A challenge as the five-step path: challenge → why → approach → solution → result. */
function challenge(n, title, parts, ic, tone = '') {
  const labels = ['Challenge', 'Why it was hard', 'Approach', 'Solution', 'Result']
  const colors = ['var(--ember)', 'var(--warn)', 'var(--sky)', 'var(--blue)', 'var(--good)']
  return `<div class="card" style="padding:24px 30px;display:grid;grid-template-columns:300px 1fr;gap:30px;align-items:start">
    <div>${tile(ic, { size: 52, tone })}<div class="mono" style="margin-top:16px">Challenge ${n}</div><div class="h4" style="margin-top:6px;font-size:25px">${title}</div></div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;position:relative;padding-top:4px">
      <div style="position:absolute;left:10px;right:10px;top:13px;height:2px;background:linear-gradient(90deg,var(--ember-2),var(--blue),var(--good));border-radius:2px"></div>
      ${parts.map((p, i) => `<div style="position:relative">
        <div style="width:20px;height:20px;border-radius:50%;background:#fff;border:4px solid ${colors[i]}"></div>
        <div class="mono" style="margin-top:12px;color:${colors[i]}">${labels[i]}</div>
        <div style="font-size:15.5px;line-height:1.48;margin-top:7px;color:var(--slate)">${p}</div></div>`).join('')}
    </div></div>`
}

// ---------- pages ----------
const defs = []
const add = (section, render, opts = {}) => defs.push({ section, render, ...opts })

// 01 — Cover
add('Cover', () => `
  <div class="glow" style="width:1100px;height:1100px;right:-300px;top:-420px;background:rgba(255,255,255,.2)"></div>
  <div class="glow" style="width:700px;height:700px;left:-200px;bottom:-360px;background:rgba(28,63,201,.55)"></div>
  <div class="abs eyebrow" style="left:120px;top:92px">Project book &nbsp;·&nbsp; ${fact('year')}</div>
  <div class="abs" style="left:120px;top:236px;width:900px;z-index:2">
    ${wordmark(196, '#fff')}
    <div class="h2" style="margin-top:44px;font-size:76px;color:#fff">Grow on purpose.</div>
    <p class="lead" style="margin-top:28px;max-width:720px;font-size:28px">A career-growth workspace where employees learn, prove their progress and ask for their next role, and where HR and managers decide in one clear workflow.</p>
  </div>
  <div class="abs" style="right:-60px;top:110px;width:1000px;height:720px;perspective:2600px;z-index:1">
    <div style="position:absolute;inset:0;transform:rotateY(-20deg) rotateX(7deg) rotateZ(1.5deg);transform-style:preserve-3d">
      <div style="position:absolute;left:260px;top:0;transform:translateZ(-160px)">${win('org-panel', { route: '/', width: 780 })}</div>
      <div style="position:absolute;left:0;top:200px;transform:translateZ(-40px)">${win('feed', { route: '/feed', width: 690 })}</div>
      <div style="position:absolute;left:390px;top:350px;transform:translateZ(80px)">${win('formations-catalog', { route: '/formations', width: 600 })}</div>
    </div>
  </div>
  <div class="abs" style="left:120px;bottom:84px;right:120px;display:grid;grid-template-columns:repeat(4,auto);justify-content:start;gap:72px;color:#fff;z-index:2">
    ${labelled('Author', fact('author'))}
    ${labelled('Year', fact('year'))}
    ${labelled('Stack', `React ${ver('react')} · Express ${ver('express')} · MySQL`)}
    ${labelled('Context', fact('context', 'institution / programme'))}
  </div>`, { variant: 'hero dots', bare: true })

// 02 — Contents
add('Contents', (ctx) => `<div class="inner">
  <div style="position:absolute;left:120px;top:260px;width:520px">
    ${eyebrow('Contents')}
    <h1 class="h1" style="margin-top:28px">Inside<br>the book.</h1>
    <p class="lead" style="margin-top:30px;font-size:25px">From the idea to the architecture, the interface and the work behind it. Every number in this book is measured from the code.</p>
  </div>
  <div style="position:absolute;left:760px;top:270px;right:120px;display:grid;grid-template-columns:1fr 1fr;column-gap:64px">
    ${ctx.toc.map(([num, title, p]) => `<div style="display:grid;grid-template-columns:70px 1fr auto;align-items:baseline;padding:17px 0;border-bottom:1px solid var(--line)">
      <span class="mono" style="color:var(--blue);font-size:15px">${num}</span><span style="font-family:var(--f-display);font-weight:700;font-size:26px;letter-spacing:-.02em">${title}</span><span class="mono" style="font-size:14px">${String(p).padStart(2, '0')}</span></div>`).join('')}
  </div></div>`, { variant: 'white' })

// 03 — 01 Project DNA
add('01 · Project DNA', () => `<div class="inner dots">
  <div style="position:absolute;left:120px;top:150px;width:720px">
    ${eyebrow('01 — Project DNA')}
    <h1 class="display" style="margin-top:30px;font-size:118px">One place<br>to grow<br>a <span class="grad">career.</span></h1>
    <p class="lead" style="margin-top:36px">CareerHive connects the three things that decide a promotion — what you learn, what you can prove, and who decides — in one workspace with a visible path.</p>
  </div>
  <div style="position:absolute;left:930px;top:190px;width:870px">
    <div class="path" style="margin-bottom:40px">
      ${[['GraduationCap', 'Learn', 'Formations, course content, progress', ''], ['Award', 'Prove', 'Skills, certificates, profile, posts', 'violet'], ['TrendingUp', 'Grow', 'Promotion request, HR review, manager decision', 'good']]
        .map(([ic, t, s, tone]) => `<div class="step">${tile(ic, { size: 68, tone })}<div class="h3" style="font-size:34px">${t}</div><div class="small" style="max-width:220px">${s}</div></div>`).join('')}
    </div>
    <div class="card" style="display:flex;gap:24px;align-items:center;padding:28px 32px">
      ${tile('MessagesSquare', { size: 60, tone: 'sky' })}
      <div><div class="h4">Connect, all along the way</div><div class="small" style="margin-top:6px">Team chat, live notifications and a feed keep the people around each step in the loop.</div></div>
    </div>
    <div class="card" style="margin-top:22px;padding:28px 32px;background:var(--ink);color:#fff;border:0">
      <div class="mono" style="color:var(--sky)">Core idea</div>
      <div class="h3" style="margin-top:12px;font-size:32px;color:#fff">Every step toward a promotion is visible — to the person growing and to the people who decide.</div>
    </div>
  </div></div>`)

// 04 — Who it's for
add('01 · Project DNA', () => {
  const roles = [
    ['User', 'Employee', 'The default role for every new account.', ['Follows formations and their content', 'Requests enrollments and promotions', 'Tracks skills, certificates, progress', 'Chats with the team, posts to the feed'], ''],
    ['ClipboardCheck', 'HR', 'First reviewer, and co-owner of the catalog.', ['Reviews pending requests first', 'Approves and forwards to the manager', 'Adds, assigns and removes formations', 'Sees the organisation dashboard'], 'warn'],
    ['UserCheck', 'Manager', 'Final decision, at any stage.', ['Approves promotions: position, salary, rating', 'Confirms or rejects formation requests', 'Builds teams, gives feedback and ratings', 'Runs the catalog with HR'], 'good'],
    ['Crown', 'Owner', 'The account named in the server config.', ['Chooses who is HR, manager or employee', 'Deletes accounts (never their own)', 'Signs in as a manager', 'Set with STAFF_EMAILS, not in the UI'], 'violet'],
  ]
  return `<div class="inner">
    <div style="position:absolute;left:120px;top:150px;width:1200px">
      ${eyebrow('01 — Project DNA · Who it is for')}
      <h2 class="h1" style="margin-top:26px">Four roles, one workspace.</h2>
    </div>
    <div class="grid4" style="position:absolute;left:120px;right:120px;top:400px">
      ${roles.map(([ic, name, line, items, tone]) => `<div class="card" style="padding:32px 30px;min-height:470px">
        ${tile(ic, { size: 70, tone })}
        <div class="h3" style="margin-top:26px">${name}</div>
        <div class="small" style="margin-top:8px;color:var(--ink)">${line}</div>
        <div style="height:1px;background:var(--line);margin:22px 0"></div>
        ${ticks(items, 'gap:12px')}
      </div>`).join('')}
    </div>
    <div class="abs note" style="left:120px;bottom:100px">Role names in the code: student · hr · manager · admin (admin can act at both stages). Owner = the email in STAFF_EMAILS.</div>
  </div>`
})

// 05 — 02 The problem (Ember)
add('02 · The problem', () => {
  const pains = [
    ['FileSpreadsheet', 'Training lives in spreadsheets', 'Enrollments, progress and certificates are spread across files and inboxes.'],
    ['CircleHelp', 'Promotions are a black box', 'People can’t see what is required, or where their request stands.'],
    ['Mails', 'Approvals travel by email', 'HR and managers chase context across threads before they can decide.'],
    ['Unplug', 'Growth isn’t shared', 'Wins and learning are posted somewhere else, far from where work is tracked.'],
  ]
  const tools = [['FileSpreadsheet', 'Spreadsheet'], ['Mail', 'Email'], ['MessageCircle', 'Chat app'], ['FolderOpen', 'Shared drive']]
  return `<div class="inner dots">
    <div style="position:absolute;left:120px;top:150px;width:760px">
      ${eyebrow('02 — The problem')}
      <h1 class="display" style="margin-top:30px;font-size:112px">Growth gets<br>lost between<br><span class="grad-ember">tools.</span></h1>
      <p class="lead" style="margin-top:34px;font-size:26px">The situation CareerHive was designed for: the pieces of a career decision exist, but they don’t meet.</p>
    </div>
    <div style="position:absolute;left:960px;top:160px;width:840px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
      ${pains.map(([ic, t, s]) => `<div class="card" style="padding:26px 26px 28px">${tile(ic, { size: 52, tone: 'ember', soft: true })}<div class="h4" style="margin-top:18px">${t}</div><div class="small" style="margin-top:8px">${s}</div></div>`).join('')}
    </div>
    <div class="card" style="position:absolute;left:960px;top:660px;width:840px;padding:28px 30px">
      <div class="mono" style="color:var(--ember-2)">Before</div>
      <div style="display:grid;grid-template-columns:140px 1fr 150px;align-items:center;margin-top:18px">
        <div style="text-align:center">${tile('User', { size: 60, tone: 'ember' })}<div class="small" style="margin-top:8px;color:var(--ember-text)">Employee</div></div>
        <svg viewBox="0 0 520 150" width="520" height="150" style="margin:0 auto">
          ${[0, 1, 2, 3].map((i) => `<path d="M10 75 C 120 75, 150 ${20 + i * 37}, 230 ${20 + i * 37} S 360 ${130 - i * 37}, 510 75" fill="none" stroke="rgba(255,138,107,${0.35 + i * 0.12})" stroke-width="2" stroke-dasharray="${i % 2 ? '6 6' : '0'}"/>`).join('')}
          ${tools.map(([ic], i) => `<g transform="translate(${118 + i * 88} ${i % 2 ? 92 : 22})"><rect width="44" height="44" rx="12" fill="#2d0f13" stroke="rgba(255,138,107,.4)"/><g transform="translate(10 10)" color="#ff8a6b">${icon(ic, 24, 1.9)}</g></g>`).join('')}
        </svg>
        <div style="text-align:center">${tile('UserCheck', { size: 60, tone: 'ember' })}<div class="small" style="margin-top:8px;color:var(--ember-text)">HR · Manager</div></div>
      </div>
    </div>
    <div class="abs note" style="left:120px;bottom:100px;color:var(--ember-dim)">Design rationale drawn from the product’s scope — not survey data.</div>
  </div>`
}, { variant: 'ember dots' })

// 06 — 03 The solution
add('03 · The solution', () => {
  const cols = [
    ['Problem', 'ember', 'CircleHelp', 'Records scattered across tools; decisions made out of sight.'],
    ['Process', 'warn', 'Workflow', 'One data model for people, formations and requests, and a two-stage review: pending → HR → manager.'],
    ['Solution', '', 'LayoutDashboard', 'A workspace: dashboard, formations with content, a promotion gate, a review queue, live notifications.'],
    ['Result', 'good', 'CircleCheck', 'Employees see exactly which rules they meet; a manager’s approval updates their profile; everyone is told live.'],
  ]
  return `<div class="inner dots">
    ${eyebrow('03 — The solution')}
    <h2 class="h1" style="margin-top:26px;max-width:1300px">From scattered to <span class="grad">one clear path.</span></h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:70px;position:relative">
      <div style="position:absolute;left:60px;right:60px;top:38px;height:3px;background:linear-gradient(90deg,var(--ember),var(--warn),var(--blue),var(--good));border-radius:3px"></div>
      ${cols.map(([t, tone, ic, s]) => `<div style="padding-right:36px;position:relative">
        ${tile(ic, { size: 78, tone })}
        <div class="mono" style="margin-top:22px;color:var(--${tone === 'ember' ? 'ember' : tone || 'blue'})">${t}</div>
        <div style="font-size:20px;line-height:1.45;margin-top:10px;color:var(--ink)">${s}</div></div>`).join('')}
    </div>
    <div style="position:absolute;left:120px;right:120px;bottom:110px;display:grid;grid-template-columns:1fr 1.25fr;gap:40px;align-items:end">
      <div class="card" style="padding:30px">
        <div class="mono">The promotion gate — PROMOTION_RULES</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:22px">
          ${[['3', 'completed formations'], ['1', 'certificate'], ['50%', 'average progress']].map(([v, l]) => `<div class="stat"><b class="grad" style="font-size:64px">${v}</b><small>${l}</small></div>`).join('')}
        </div>
      </div>
      ${win('promotion', { route: '/promotion', width: 890, region: [300, 60, 1000, 300] })}
    </div>
  </div>`
})

// 07 — 04 Features map
add('04 · Features', () => {
  const items = [
    ['TrendingUp', 'Promotion requests', 'Gated by real rules; HR, then manager', 'good'],
    ['GraduationCap', 'Formations', 'Catalog, requests, assignment, content', ''],
    ['ClipboardCheck', 'Review queue', 'Two-stage decisions with comments', 'warn'],
    ['ChartColumn', 'Skills & analytics', 'Mastery radar, org KPIs and pipelines', 'violet'],
    ['Compass', 'CV coach', 'Reads a CV, matches formations and a manager', 'violet'],
    ['MessagesSquare', 'Team comm hub', 'Messenger-style chat between accounts', 'sky'],
    ['Bell', 'Live notifications', 'Server-Sent Events, pop-ups, desktop alerts', 'indigo'],
    ['Newspaper', 'Feed & profiles', 'Posts with images, likes, comments, follows', 'bad'],
    ['UserCog', 'Accounts & roles', 'Email confirmation, OAuth, owner-set roles', 'ink'],
  ]
  return `<div class="inner dots">
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <div>${eyebrow('04 — Features')}<h2 class="h1" style="margin-top:26px">Nine features,<br>one workflow.</h2></div>
      <p class="lead" style="max-width:640px;font-size:25px">Each feature feeds the next: what you learn and certify unlocks a promotion request; decisions flow back to your profile.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:50px">
      ${items.map(([ic, t, s, tone], i) => `<div class="card" style="padding:26px 28px;display:flex;gap:24px;align-items:center;position:relative;min-height:150px">
        ${tile(ic, { size: 62, tone })}<div style="min-width:0"><div class="h4" style="font-size:25px">${t}</div><div class="small" style="margin-top:6px">${s}</div></div>
        <span class="mono" style="position:absolute;right:22px;top:18px;font-size:13px">${String(i + 1).padStart(2, '0')}</span></div>`).join('')}
    </div>
    <div class="abs" style="left:120px;right:120px;bottom:100px;display:flex;gap:14px;flex-wrap:wrap">
      ${['3 themes: Frost · Ember · Light', '3D mascots & emblem logo', 'Custom cursor', '9 animated section backgrounds', 'Demo mode without a server'].map((c) => `<span class="chip soft">${c}</span>`).join('')}
    </div>
  </div>`
})

// 08–13 — feature stories
add('04 · Features', () => feature({
  idx: 1, title: 'Promotion requests', icon: 'TrendingUp', tone: 'good',
  purpose: 'Turns “am I ready?” into a checklist, and a request into a tracked, two-stage decision.',
  benefit: 'Employees see exactly what unlocks their next role; managers receive a complete file — skills, certificates, justification.',
  how: ['<b>Gate:</b> 3 completed formations, 1 certificate, 50 % average progress', '<b>Stages:</b> pending → HR review → on-hold → manager decision', '<b>Approval</b> writes the new position and salary to the profile', '<b>Every step</b> notifies the employee'],
  main: 'promotion', mainRoute: '/promotion', second: 'reviews', secondRoute: '/reviews', region: [300, 90, 1000, 560],
}))
add('04 · Features', () => feature({
  idx: 2, title: 'Formations & course content', icon: 'GraduationCap',
  purpose: 'A training catalog people actually use: covers generated from real tech logos, content inside, progress that follows it.',
  benefit: 'Learning and its evidence live in one place, so progress is real — not a number someone types.',
  how: ['<b>Join</b> by request (HR → manager) or by assignment', '<b>Content:</b> videos, files and links; uploads with a progress bar', '<b>Progress</b> = finished items ÷ all items', '<b>HR & managers</b> add, assign and remove formations'],
  main: 'formations-catalog', mainRoute: '/formations', second: 'formation-drawer', secondRoute: '/formations · course content', region: [850, 10, 580, 440], at: [1350, 560], w: 460,
}))
add('04 · Features', () => feature({
  idx: 3, title: 'Review queue', icon: 'ClipboardCheck', tone: 'warn',
  purpose: 'Where HR and managers decide — promotions and formation requests, each at its stage.',
  benefit: 'Nothing waits in an inbox: the queue shows what needs you, with the employee’s full context.',
  how: ['<b>HR</b> approves and forwards pending requests', '<b>Managers</b> decide at any stage, with position, salary and rating', '<b>Reject</b> with comments the employee sees', '<b>Nobody</b> can review their own request'],
  main: 'reviews', mainRoute: '/reviews', second: 'formation-manage', secondRoute: '/formations · manage', region: [850, 330, 580, 460], at: [1350, 560], w: 460,
}))
add('04 · Features', () => feature({
  idx: 4, title: 'Team hub & live notifications', icon: 'MessagesSquare', tone: 'sky',
  purpose: 'A Messenger-style chat between accounts, and a bell that updates the moment something happens.',
  benefit: 'Questions about a request or a course get answered where the work is — and nobody refreshes to find out.',
  how: ['<b>Contacts by role:</b> employees reach managers, HR and teammates', '<b>Presence</b> from each account’s last activity', '<b>Push:</b> Server-Sent Events, 20 s polling fallback', '<b>Pop-ups,</b> sound, desktop alerts, unread count in the tab'],
  main: 'team-hub', mainRoute: '/team', second: 'notifications', secondRoute: '/ · notifications', region: [915, 100, 390, 440], at: [1400, 520], w: 400,
}))
add('04 · Features', () => feature({
  idx: 5, title: 'Feed & public profiles', icon: 'Newspaper', tone: 'bad',
  purpose: 'A LinkedIn-style layer: share wins with an image, follow colleagues, read their profiles.',
  benefit: 'Growth becomes visible to the team — a certificate or a finished course is something people can react to.',
  how: ['<b>Posts:</b> text + one image, resized in the browser', '<b>Server checks</b> the image signature before saving it', '<b>Likes, comments, follows</b> — each notifies the author', '<b>Suggestions</b> put teammates first'],
  main: 'feed', mainRoute: '/feed', second: 'public-profile', secondRoute: '/u/3', region: [300, 90, 1000, 560],
}))
add('04 · Features', () => feature({
  idx: 6, title: 'Skills & organisation analytics', icon: 'ChartColumn', tone: 'violet',
  purpose: 'Skills over time for each person, and the organisation at a glance for HR and managers.',
  benefit: 'Decisions rest on the same data employees see: formations, certificates, progress and requests.',
  how: ['<b>Mastery radar</b> and weekly activity, derived from real records', '<b>Staff KPIs:</b> employees, enrollments, certificates, ratings', '<b>Pipelines</b> for promotion and formation requests', '<b>Top skills</b> with their technology logos'],
  main: 'skills', mainRoute: '/skills', second: 'org-panel', secondRoute: '/ · organisation', region: [300, 40, 1000, 580],
}))
add('04 · Features', () => feature({
  idx: 7, title: 'CV coach', icon: 'Compass', tone: 'violet',
  purpose: 'Upload a CV and get a plan: the skills it shows, the ones to learn next, the best formations and the manager to learn from.',
  benefit: 'Advice comes from this company’s real catalog and teams, so every suggestion is something you can start today.',
  how: ['<b>Reads</b> PDF, Word and text on the server; the file itself is never stored', '<b>Finds</b> skills, years of experience, seniority and a career track', '<b>Ranks</b> formations by the gaps they fill, managers by what their teams know', '<b>Explains</b> every match; rules, not an AI service'],
  main: 'cv-results', mainRoute: '/profile · career compass', second: 'cv-loading', secondRoute: '/profile · analysing', region: [461, 144, 518, 610], at: [1400, 470], w: 380,
}))

// 14 — 05 User journey
add('05 · User experience', () => {
  const steps = [
    ['login-frost', 'LogIn', 'Sign in', 'Email + password or Google, LinkedIn, GitHub'],
    ['dashboard-employee', 'LayoutDashboard', 'Dashboard', 'Readiness, recommendations, progress'],
    ['formations-catalog', 'GraduationCap', 'Request', 'Ask to join a formation'],
    ['reviews', 'ClipboardCheck', 'Review', 'HR forwards, the manager confirms'],
    ['formation-drawer', 'PlayCircle', 'Learn', 'Videos, files, links — progress follows'],
    ['promotion', 'TrendingUp', 'Promotion', 'All rules met → request your next role'],
    ['profile', 'BadgeCheck', 'Result', 'Approval updates the profile'],
  ]
  return `<div class="inner dots">
    ${eyebrow('05 — User experience')}
    <h2 class="h1" style="margin-top:26px">An employee’s path, <span class="grad">end to end.</span></h2>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:18px;margin-top:64px;position:relative;align-items:start">
      <div style="position:absolute;left:6%;right:6%;top:258px;height:2px;background:linear-gradient(90deg,var(--sky),var(--blue),var(--indigo));border-radius:2px"></div>
      ${steps.map(([s, ic, t, c], i) => `<div style="display:grid;justify-items:center;text-align:center;gap:16px;position:relative;align-content:start">
        <div class="win" style="width:100%;border-radius:14px"><div style="height:200px;overflow:hidden"><img src="${shot(s)}" style="width:100%;height:100%;object-fit:cover;object-position:top left"></div></div>
        ${tile(ic, { size: 56, tone: i === 6 ? 'good' : '' })}
        <div class="mono" style="color:var(--blue)">Step ${i + 1}</div>
        <div class="h4" style="font-size:25px">${t}</div>
        <div class="small" style="font-size:16px">${c}</div></div>`).join('')}
    </div>
    <div class="card abs" style="left:120px;right:120px;bottom:100px;padding:22px 30px;display:flex;align-items:center;gap:22px">
      ${tile('Bell', { size: 46, tone: 'sky', soft: true })}
      <div class="small" style="color:var(--ink);font-size:19px">At each step the right people are notified live — the employee when a decision lands, HR and managers when something waits for them.</div>
    </div>
  </div>`
})

// 15 — 06 Architecture (Night)
add('06 · Architecture', () => {
  const chipN = (t) => `<span class="chip" style="font-size:14px;padding:6px 12px">${t}</span>`
  const box = (x, y, w, h, inner) => `<div class="card" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;padding:26px 28px">${inner}</div>`
  const head = (ic, t, s, tone = 'sky') => `<div style="display:flex;gap:16px;align-items:center">${tile(ic, { size: 52, tone })}<div><div class="h4" style="color:#fff">${t}</div><div class="small" style="font-size:15px">${s}</div></div></div>`
  const svc = (y, ic, t, s, slug) => `<div style="position:absolute;left:1370px;top:${y}px;width:430px;display:flex;gap:16px;align-items:center" class="card">${slug ? logoTile({ slug, size: 52 }) : tile(ic, { size: 52, tone: 'sky' })}<div><div class="h4" style="font-size:21px;color:#fff">${t}</div><div class="small" style="font-size:15px">${s}</div></div></div>`
  return `<div class="inner grid-tex">
    ${eyebrow('06 — System architecture')}
    <h2 class="h1" style="margin-top:22px;color:#fff;font-size:76px">How the pieces talk.</h2>
    ${box(120, 330, 430, 520, `${head('Monitor', 'Browser', 'React SPA · Vite build')}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:22px">${[`React ${ver('react')}`, `React Router ${ver('react-router-dom')}`, `Framer Motion ${ver('framer-motion')}`, `Three.js ${ver('three')} · R3F ${ver('@react-three/fiber')}`, `Recharts ${ver('recharts')}`, 'Lucide · Simple Icons'].map(chipN).join('')}</div>
      <div style="margin-top:22px;padding:18px;border-radius:18px;border:1px dashed var(--night-line)"><div class="mono" style="color:var(--sky)">Store</div><div class="small" style="font-size:15px;margin-top:6px">React context + reducer; live refresh on server events</div></div>
      <div style="margin-top:14px;padding:18px;border-radius:18px;border:1px dashed var(--night-line)"><div class="mono" style="color:var(--sky)">Demo mode</div><div class="small" style="font-size:15px;margin-top:6px">No VITE_API_URL → an in-browser mock of every route</div></div>`)}
    ${box(740, 330, 470, 520, `${head('Server', `Express ${ver('express')} API`, `Node.js ${nodeEngine.replace('>=', '≥ ')}`)}
      <div class="mono" style="margin-top:22px;color:var(--sky)">Middleware</div>
      <div style="display:grid;gap:8px;margin-top:10px">${['CORS allow-list · nosniff', 'JSON bodies (≤ 12 MB)', 'requireAuth: JWT → role read from DB', 'Rate limit on /api/auth', 'Multer uploads (disk; CVs in memory)'].map((m) => `<div style="font-size:15.5px;color:var(--night-text);display:flex;gap:10px;align-items:center"><span style="width:7px;height:7px;border-radius:50%;background:var(--sky)"></span>${m}</div>`).join('')}</div>
      <div class="mono" style="margin-top:22px;color:var(--sky)">Route modules · 70 handlers</div>
      <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px">${['auth', 'dashboard', 'users', 'skills', 'teams', 'chat', 'promotions', 'formations', 'resources', 'notifications', 'social', 'cv'].map(chipN).join('')}</div>`)}
    ${svc(330, 'Database', 'MariaDB 10.4 / MySQL 8', '23 tables · mysql2 · UTC', 'mariadb')}
    ${svc(462, 'HardDrive', 'Upload storage', 'Local disk, served at /uploads')}
    ${svc(594, 'Mail', 'Gmail SMTP', 'Nodemailer · confirmation & reset', 'gmail')}
    ${svc(726, 'KeyRound', 'OAuth 2.0 providers', 'Google · LinkedIn · GitHub')}
    <svg class="abs" style="left:0;top:0" width="1920" height="1080">
      <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5fb2ff"/></marker></defs>
      <path d="M550 520 H736" stroke="#5fb2ff" stroke-width="2.5" marker-end="url(#ar)"/>
      <path d="M740 640 H554" stroke="#8fd0ff" stroke-width="2.5" stroke-dasharray="7 7" marker-end="url(#ar)"/>
      ${[380, 512, 644, 776].map((y) => `<path d="M1210 ${Math.min(Math.max(y, 400), 800)} C 1290 ${Math.min(Math.max(y, 400), 800)}, 1290 ${y}, 1366 ${y}" fill="none" stroke="#5fb2ff" stroke-width="2" marker-end="url(#ar)" opacity=".85"/>`).join('')}
    </svg>
    <div class="abs mono" style="left:566px;top:486px;color:#fff">HTTPS · JSON</div><div class="abs mono" style="left:566px;top:538px;color:var(--night-dim);font-size:11px">Bearer JWT</div>
    <div class="abs mono" style="left:566px;top:656px;color:#fff">SSE push</div><div class="abs mono" style="left:566px;top:680px;color:var(--night-dim);font-size:11px">live notifications</div>
    <div class="card abs" style="left:120px;right:120px;bottom:96px;padding:20px 28px;display:flex;align-items:center;gap:26px">
      <span class="mono" style="color:var(--sky)">Deployment · ${content.api ? 'live' : content.demo ? 'UI live (demo data)' : 'prepared'}</span>
      <span style="display:flex;gap:10px;align-items:center">${logoTile({ slug: 'vercel', size: 38 })}<span class="small" style="color:#fff">UI on Vercel (SPA rewrite)</span></span>
      <span style="display:flex;gap:10px;align-items:center">${content.api ? '' : logoTile({ slug: 'railway', size: 38 })}${logoTile({ slug: 'render', size: 38 })}<span class="small" style="color:#fff">${content.api ? 'API on Render · MySQL 8.4 on Aiven' : 'API + MySQL on Railway / Render'}</span></span>
      <span style="display:flex;gap:10px;align-items:center">${logoTile({ slug: 'xampp', size: 38 })}<span class="small" style="color:#fff">Local: XAMPP</span></span>
      <span style="margin-left:auto">${fact('demo', 'is it deployed? live URL')}</span>
    </div>
  </div>`
}, { variant: 'night' })

// 16 — 07 Technology stack
add('07 · Technology stack', () => {
  const item = (logo, name, role) => `<div style="display:flex;gap:14px;align-items:center;padding:11px 0;border-top:1px solid var(--line)">${logo}<div><div style="font-weight:650;font-size:18px">${name}</div><div style="font-size:14.5px;color:var(--slate);margin-top:2px">${role}</div></div></div>`
  const L = (slug, size = 42) => logoTile({ slug, size })
  const I = (lucide, size = 42) => logoTile({ lucide, size })
  const groups = [
    ['Frontend', 'Monitor', [[L('react'), `React ${ver('react')}`, 'UI components, state in context'], [L('vite'), `Vite ${ver('vite')}`, 'Dev server and production build'], [L('reactrouter'), `React Router ${ver('react-router-dom')}`, 'Routes and deep links'], [L('framer'), `Framer Motion ${ver('framer-motion')}`, 'Page, list and layout motion'], [I('ChartColumn'), `Recharts ${ver('recharts')}`, 'Charts: weekly bars, radar'], [L('lucide'), 'Lucide · Simple Icons', 'Animated icons, real tech logos']]],
    ['3D', 'Box', [[L('threedotjs'), `Three.js ${ver('three')}`, 'Rendering'], [I('Orbit'), `React Three Fiber ${ver('@react-three/fiber')} · drei ${ver('@react-three/drei')}`, 'Mascots, emblem logo, loading screen'], [L('sketchfab'), 'Sketchfab models', 'CC-BY-4.0, credited']]],
    ['Backend', 'Server', [[L('nodedotjs'), `Node.js ${nodeEngine.replace('>=', '≥ ')}`, 'Runtime (ES modules)'], [L('express'), `Express ${ver('express')}`, 'REST API, async errors'], [L('jsonwebtokens'), `jsonwebtoken ${ver('jsonwebtoken')}`, 'Sessions, OAuth state'], [I('KeyRound'), `bcryptjs ${ver('bcryptjs')}`, 'Password hashing'], [I('Upload'), `Multer ${ver('multer')} · unpdf · mammoth`, 'Uploads; CVs read from PDF and Word'], [I('Gauge'), `express-rate-limit ${ver('express-rate-limit')}`, 'Auth abuse protection'], [L('gmail'), `Nodemailer ${ver('nodemailer')} · Gmail`, 'Confirmation and reset emails']]],
    ['Data & infrastructure', 'Database', [[L('mariadb'), 'MariaDB 10.4 · MySQL 8', '23 tables, UTC timestamps'], [L('mysql'), `mysql2 ${ver('mysql2')}`, 'Driver, parameterised queries'], [L('xampp'), 'XAMPP', 'Local database'], [L('vercel'), 'Vercel', 'UI hosting config'], [L('railway'), 'Railway / Render', 'API deployment notes']]],
    ['Quality & tools', 'TestTubeDiagonal', [[L('nodedotjs'), 'node:test', '35 end-to-end API tests'], [I('MonitorPlay'), `Playwright ${ver('playwright')}`, 'UI checks and these screenshots'], [L('oxc'), `Oxlint ${ver('oxlint')}`, 'Linting'], [L('google'), 'OAuth apps', 'Google · LinkedIn · GitHub']]],
  ]
  return `<div class="inner">
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <div>${eyebrow('07 — Technology stack')}<h2 class="h1" style="margin-top:22px">The ecosystem.</h2></div>
      <div class="card" style="padding:16px 22px;display:flex;gap:14px;align-items:center">${tile('BrainCircuit', { size: 40, tone: 'ink', soft: true })}<div><div class="mono">AI</div><div style="font-size:16px;margin-top:4px">Not used — the CV coach runs on rules, not an AI service.</div></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1.1fr .9fr 1.1fr 1fr 1fr;gap:22px;margin-top:40px">
      ${groups.map(([g, ic, items]) => `<div class="card" style="padding:24px 22px 12px">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">${tile(ic, { size: 40 })}<div class="h4" style="font-size:21px">${g}</div></div>
        ${items.map(([l, n, r]) => item(l, n, r)).join('')}</div>`).join('')}
    </div>
    <div class="abs note" style="left:120px;bottom:100px">Versions read from the two package.json files when this book is built.</div>
  </div>`
}, { variant: 'white' })

// 17 — 08 Technical highlights: accounts
add('08 · Technical highlights', () => {
  const flow = (steps) => `<div class="path">${steps.map(([ic, t, s, tone]) => `<div class="step">${tile(ic, { size: 60, tone })}<div class="h4" style="font-size:21px">${t}</div><div class="small" style="font-size:15.5px;max-width:190px">${s}</div></div>`).join('')}</div>`
  return `<div class="inner dots">
    ${eyebrow('08 — Technical highlights · Accounts')}
    <h2 class="h1" style="margin-top:22px">Accounts that <span class="grad">prove</span> who you are.</h2>
    <div class="card" style="margin-top:50px;padding:32px 36px">
      <div class="mono" style="margin-bottom:26px">Email sign-up</div>
      ${flow([['UserPlus', 'Sign up', 'Name, email, password (8+ characters)'], ['Lock', 'Hash', 'bcrypt, cost 10'], ['MailCheck', 'Email link', 'Random token; only its SHA-256 is stored', 'sky'], ['Timer', 'Expires', '24 h, single use', 'warn'], ['CircleCheck', 'Confirmed', 'Email verified, signed in', 'good'], ['KeyRound', 'Session', 'JWT for 7 days; role re-read on every request', 'indigo']])}
    </div>
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:28px;margin-top:28px">
      <div class="card" style="padding:32px 36px">
        <div class="mono" style="margin-bottom:26px">Social sign-in</div>
        ${flow([['LogIn', 'Provider', 'Google · LinkedIn · GitHub'], ['ShieldCheck', 'Signed state', 'JWT, 10 minutes', 'sky'], ['UserCheck', 'Account', 'Created as employee; owner email → manager', 'good'], ['ArrowRight', 'Back to the app', '/oauth-success with a session', 'indigo']])}
      </div>
      <div class="card" style="padding:32px 36px">
        <div class="mono" style="margin-bottom:18px">Also</div>
        ${ticks(['<b>Password reset</b> by a 60-minute single-use link', '<b>Rate limit:</b> 30 requests / 15 min on /api/auth', '<b>Same answer</b> whether or not an email exists', '<b>Owner</b> sets roles; new accounts are employees'])}
      </div>
    </div>
  </div>`
})

// 18 — 08 Technical highlights: realtime, uploads, workflow, demo
add('08 · Technical highlights', () => {
  const card = (ic, tone, t, body) => `<div class="card" style="padding:38px 40px;min-height:330px"><div style="display:flex;gap:16px;align-items:center">${tile(ic, { size: 56, tone })}<div class="h3" style="font-size:28px">${t}</div></div><div style="margin-top:20px">${body}</div></div>`
  const mini = (steps) => `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px">${steps.map((s, i) => `${i ? `<span style="color:var(--sky)">${icon('ArrowRight', 20, 2.4)}</span>` : ''}<span class="chip" style="font-size:16px">${s}</span>`).join('')}</div>`
  return `<div class="inner">
    ${eyebrow('08 — Technical highlights · Platform')}
    <h2 class="h1" style="margin-top:22px">Built for the browser’s rules.</h2>
    <div class="grid2" style="margin-top:44px;gap:26px">
      ${card('Radio', 'sky', 'Live notifications', `${mini(['Event', 'INSERT notification', 'publish()', 'SSE stream', 'UI refresh'])}
        <div class="small" style="margin-top:24px;font-size:19.5px">EventSource can’t send headers, so the stream authenticates with the JWT in its query string. <b style="color:var(--ink)">retry 5 s · ping 25 s · 20 s polling fallback.</b></div>`)}
      ${card('HardDrive', 'indigo', 'Uploads & media', `${mini(['Multer', 'random 128-bit name', '/uploads', '&lt;video&gt; plays natively'])}
        <div class="small" style="margin-top:24px;font-size:19.5px">HTML, SVG and script files are refused. Post images are resized in the browser (1600 px) and checked by their byte signature on the server.</div>`)}
      ${card('Workflow', 'good', 'Role-based workflow', `${mini(['pending', 'HR review', 'on-hold', 'manager', 'approved · rejected'])}
        <div class="small" style="margin-top:24px;font-size:19.5px">requireRole guards each action; managers can decide at any stage so nothing blocks without HR; HR and managers run the catalog but can’t join it.</div>`)}
      ${card('FlaskConical', 'violet', 'Demo mode', `${mini(['No VITE_API_URL', 'demoRequest()', 'same payloads'])}
        <div class="small" style="margin-top:24px;font-size:19.5px">An in-browser server mirrors the API route by route, so the whole UI — including the feed — runs without a backend. This book’s screenshots use it.</div>`)}
    </div>
  </div>`
}, { variant: 'white' })

// 19 — 09 Data model
add('09 · Data model', () => {
  const t = (name, cols, extra = '') => `<div style="border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden;${extra}">
    <div style="padding:9px 14px;background:linear-gradient(90deg,rgba(47,123,246,.12),rgba(95,178,255,.06));font-family:var(--f-mono);font-size:13.5px;font-weight:500;color:var(--ink);letter-spacing:.02em">${name}</div>
    <div style="padding:9px 14px;display:grid;gap:4px">${cols.map((c) => `<div style="font-family:var(--f-mono);font-size:11.5px;color:var(--slate);letter-spacing:.01em">${c}</div>`).join('')}</div></div>`
  const cluster = (x, y, w, title, ic, tone, tables) => `<div class="card" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;padding:20px 20px 22px">
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">${tile(ic, { size: 38, tone })}<div class="h4" style="font-size:20px">${title}</div></div>
    <div style="display:grid;gap:10px">${tables}</div></div>`
  return `<div class="inner dots">
    ${eyebrow('09 — Data model')}
    <h2 class="h2" style="margin-top:20px">23 tables around one: <span class="grad">users.</span></h2>
    <svg class="abs" style="left:0;top:0" width="1920" height="1080">
      ${[[720, 570, 560, 570], [960, 470, 960, 434], [960, 684, 960, 716], [1200, 540, 1380, 440], [1200, 620, 1380, 770]]
        .map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="#2f7bf6" stroke-width="2" stroke-dasharray="1 0" opacity=".45"/>`).join('')}
    </svg>
    ${cluster(120, 300, 440, 'Learning', 'GraduationCap', '', [
      t('formations', ['title · level · category', 'available · created_by → users']),
      t('user_formation_progress', ['user_id · formation_id', 'progress · status · assigned_by']),
      t('formation_requests', ['status: pending → on-hold → approved | rejected']),
      t('formation_resources → resource_completions', ['kind · url · storage_path · done per user']),
      t('formation_skills', ['formation_id · skill_name']),
    ].join(''))}
    <div class="card" style="position:absolute;left:720px;top:470px;width:480px;padding:22px 24px;border:2px solid rgba(47,123,246,.35);box-shadow:var(--elev-lg)">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">${tile('Users', { size: 44 })}<div class="h3" style="font-size:28px">users</div><span class="chip" style="margin-left:auto;font-size:13px">1 — N to all</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px">${['id · email (unique)', 'role: student · hr · manager · admin', 'password_hash (bcrypt)', 'email_verified_at', 'oauth_provider · oauth_id', 'position · department', 'profile_photo · cover_photo', 'last_seen_at (presence)'].map((c) => `<div style="font-family:var(--f-mono);font-size:11.5px;color:var(--slate)">${c}</div>`).join('')}</div>
    </div>
    ${cluster(720, 290, 480, 'Access', 'KeyRound', 'ink', t('auth_tokens', ['user_id · purpose (verify_email | reset_password)', 'token_hash (SHA-256) · expires_at · used_at']))}
    ${cluster(720, 716, 480, 'Social', 'Newspaper', 'bad', `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${t('posts', ['user_id · body · image_path'])}${t('follows', ['follower_id · followee_id'])}${t('post_likes', ['post_id · user_id'])}${t('post_comments', ['post_id · user_id · body'])}</div>`)}
    ${cluster(1380, 288, 420, 'Growth', 'TrendingUp', 'good', [
      t('promotion_requests', ['requested_position · salary · status', 'hr_* review · manager_* decision']),
      t('promotion_request_skills · _certificates', ['evidence attached to a request']),
      t('skills · certificates · cv_analyses', ['per user · one CV analysis (JSON) each']),
    ].join(''))}
    ${cluster(1380, 664, 420, 'Teams & messages', 'MessagesSquare', 'sky', [
      t('teams → team_members → team_member_skills', ['manager_user_id · rating · feedback']),
      t('chat_messages', ['sender_id · recipient_id · read_at']),
      t('notifications', ['user_id · type · link · is_read']),
    ].join(''))}
    <div class="abs note" style="left:120px;bottom:100px;width:560px">Foreign keys cascade on delete · all DATETIMEs in UTC · no secrets or personal data shown</div>
  </div>`
})

// 20 — 10 Design system
add('10 · UI / UX design', () => {
  const theme = (name, sw, desc) => `<div class="card" style="padding:20px 24px">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="h3" style="font-size:30px">${name}</div><span class="mono">${desc}</span></div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:14px">${sw.map(([c, l]) => `<div><div style="height:52px;border-radius:16px;background:${c};border:1px solid var(--line)"></div><div style="font-family:var(--f-mono);font-size:11px;color:var(--slate);margin-top:8px">${l}<br>${c}</div></div>`).join('')}</div></div>`
  return `<div class="inner">
    ${eyebrow('10 — UI / UX design · The system')}
    <h2 class="h1" style="margin-top:18px;font-size:76px">Three themes, one language.</h2>
    <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:28px;margin-top:30px">
      <div style="display:grid;gap:14px">
        ${theme('Frost', [['#dfe7f3', 'page'], ['#f5f8fc', 'frame'], ['#2f7bf6', 'accent'], ['#5fb2ff', 'accent 2'], ['#0e1a2f', 'text']], 'default')}
        ${theme('Ember', [['#1b090b', 'page'], ['#4a1a1f', 'frame'], ['#f2554a', 'accent'], ['#ff8a6b', 'accent 2'], ['#fff4f1', 'text']], 'dark')}
        ${theme('Light', [['#f2d9d7', 'page'], ['#fff8f6', 'frame'], ['#d63a3a', 'accent'], ['#f0664e', 'accent 2'], ['#2a0e12', 'text']], 'warm')}
      </div>
      <div style="display:grid;gap:14px;align-content:start">
        <div class="card" style="padding:20px 24px">
          <div class="mono">Type</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:10px 22px;align-items:baseline;margin-top:16px">
            <span style="font-family:var(--f-display);font-weight:800;font-size:54px;letter-spacing:-.05em;line-height:1">Aa</span><span><b>Bricolage Grotesque</b><br><span class="small">Headlines, figures</span></span>
            <span style="font-family:var(--f-body);font-weight:500;font-size:44px;line-height:1">Aa</span><span><b>Onest</b><br><span class="small">Interface and reading text</span></span>
            <span style="font-family:var(--f-mono);font-size:34px;line-height:1">Aa</span><span><b>Martian Mono</b><br><span class="small">Labels, eyebrows, data</span></span>
          </div>
        </div>
        <div class="card" style="padding:20px 24px">
          <div class="mono">Components</div>
          <div style="display:flex;gap:12px;margin-top:18px;align-items:center">${tile('Users', { size: 52 })}${tile('GraduationCap', { size: 52, tone: 'sky' })}${tile('Award', { size: 52, tone: 'warn' })}${tile('Star', { size: 52, tone: 'violet' })}${tile('CheckCheck', { size: 52, tone: 'good', soft: true })}</div>
          <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap"><span class="chip">Accent chip</span><span class="chip soft">Neutral</span><span style="padding:10px 18px;border-radius:14px;background:var(--blue);color:#fff;font-weight:600;font-size:16px">Primary</span><span style="padding:10px 18px;border-radius:14px;background:rgba(14,26,47,.08);font-weight:600;font-size:16px">Ghost</span><span style="padding:10px 18px;border-radius:14px;background:var(--bad);color:#fff;font-weight:600;font-size:16px">Danger</span></div>
        </div>
        <div class="card" style="padding:20px 24px">
          <div class="mono">Principles</div>
          ${ticks(['<b>Glass cards</b> over living backgrounds, one shadow system per theme', '<b>Icons never alone:</b> a tile, a label, a colour meaning', '<b>Motion with a purpose,</b> off when the OS asks for less'], 'margin-top:14px;gap:10px')}
        </div>
      </div>
    </div>
  </div>`
}, { variant: 'white' })

// 21 — Annotated UI
add('10 · UI / UX design', () => {
  const W = 1180, k = W / 1440
  const pts = [[120, 95, 1], [150, 245, 2], [520, 200, 3], [1000, 124, 4], [520, 410, 5], [1100, 470, 6], [1360, 250, 7], [1180, 70, 8]]
  const legend = [['Brand', 'Emblem logo and the animated CareerHive title'], ['Your team', 'Presence dots from each account’s last activity'], ['Hero', 'Position, promotion readiness and the next action'], ['Recommended', 'Formations you’re not enrolled in yet'], ['My formations', 'Progress on real covers; open to continue'], ['Statistics', 'Learning hours, skills, certificates, completed'], ['Right rail', 'Everyone you can message, one click away'], ['Top bar', 'Search, theme, certificates and live notifications']]
  return `<div class="inner">
    ${eyebrow('10 — UI / UX design · Anatomy of the dashboard')}
    <div style="position:absolute;left:120px;top:210px;width:${W}px">
      <div style="position:relative">${win('dashboard-employee', { route: '/', width: W })}
        ${pts.map(([x, y, n]) => `<div class="callout" style="left:${x * k - 22}px;top:${40 + y * k - 22}px">${n}</div>`).join('')}
      </div>
    </div>
    <div style="position:absolute;left:1360px;top:190px;width:440px">
      <h2 class="h2" style="font-size:50px">Everything that decides your next step, on one screen.</h2>
      <div style="display:grid;gap:14px;margin-top:34px">${legend.map(([t, s], i) => `<div style="display:flex;gap:14px;align-items:flex-start"><span class="legend-num">${i + 1}</span><div><div style="font-weight:650;font-size:18px">${t}</div><div class="small" style="font-size:15.5px;margin-top:2px">${s}</div></div></div>`).join('')}</div>
    </div>
  </div>`
}, { variant: 'white' })

// 22 — Motion & 3D
add('10 · UI / UX design', () => {
  const bgs = ['mesh', 'spotlight', 'beams', 'globe', 'ribbons', 'bokeh', 'dots', 'curtains', 'network']
  return `<div class="inner">
    ${eyebrow('10 — UI / UX design · Motion & 3D')}
    <h2 class="h1" style="margin-top:22px;color:#fff">Alive, <span class="grad-light">not noisy.</span></h2>
    <div style="position:absolute;left:120px;top:370px;width:820px">
      ${win('login-frost', { route: '/ · sign in', width: 820, height: 420, pos: 'top left' })}
      <div class="shot-cap" style="color:var(--night-dim)">3D mascot: portal entrance, head and eyes follow the cursor</div>
    </div>
    <div style="position:absolute;left:990px;top:190px;width:810px">
      <div class="mono" style="color:var(--sky);margin-bottom:14px">9 animated section backgrounds</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${bgs.map((b) => `<div style="border-radius:14px;overflow:hidden;border:1px solid var(--night-line);position:relative"><img src="../assets/screenshots/backgrounds/${b}.png" style="width:100%;height:118px;object-fit:cover;filter:saturate(1.8) contrast(1.35) brightness(.97)"><span class="mono" style="position:absolute;left:10px;bottom:8px;color:#0e1a2f;background:rgba(255,255,255,.85);padding:3px 8px;border-radius:6px;font-size:10.5px">${b}</span></div>`).join('')}</div>
      <div class="card" style="margin-top:22px;padding:26px 28px">
        ${ticks(['<b>Budgets:</b> canvas scenes run at ~40 fps and pause in background tabs', '<b>Respect:</b> every animation stops with “reduce motion”', '<b>On demand:</b> the logo renders once, and again only on a theme change', '<b>Lazy:</b> the 3D engine is a separate chunk, loaded when needed', '<b>Details:</b> a theme-coloured portal-gun cursor, a coin-turn loading screen'], 'gap:10px')}
      </div>
    </div>
  </div>`
}, { variant: 'night' })

// 23 — 11 Responsive
add('11 · Responsive', () => `<div class="inner dots">
  <div style="position:absolute;left:120px;top:150px;width:560px">
    ${eyebrow('11 — Responsive design')}
    <h2 class="h1" style="margin-top:22px">Desk, couch, commute.</h2>
    <p class="lead" style="margin-top:26px;font-size:25px">The same app from 1440 px to a 390 px phone: the sidebar becomes a menu, grids fold into one column, the chat keeps its thread.</p>
    ${ticks(['<b>Breakpoints</b> at 1280, 1100, 900, 820, 640 and 520 px', '<b>Touch:</b> the custom cursor turns itself off', '<b>Screens</b> captured at 1440 × 900, 834 × 1112 and 390 × 844'], 'margin-top:30px')}
  </div>
  <div style="position:absolute;left:700px;top:230px">${win('dashboard-employee', { route: '/', width: 860 })}</div>
  <div style="position:absolute;left:1300px;top:420px;width:360px;padding:14px;border-radius:40px;background:#0e1a2f;box-shadow:var(--elev-lg)">
    <div style="border-radius:28px;overflow:hidden;height:480px"><img src="${shot('dashboard-tablet')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div>
  </div>
  <div style="position:absolute;left:1620px;top:300px;width:230px;padding:10px;border-radius:40px;background:#0e1a2f;box-shadow:var(--elev-lg)">
    <div style="border-radius:32px;overflow:hidden;height:480px;position:relative"><img src="${shot('feed-mobile')}" style="width:100%;height:100%;object-fit:cover;object-position:top"></div>
  </div>
  <div class="abs mono" style="left:700px;bottom:100px">Desktop 1440</div><div class="abs mono" style="left:1300px;bottom:100px">Tablet 834</div><div class="abs mono" style="left:1620px;bottom:100px">Phone 390</div>
</div>`)

// 24 — 12 Project journey
add('12 · Project journey', () => {
  const phases = [
    ['Palette', 'Interface', 'The Ember / Frost redesign in React: dashboard, profile, formations, skills, chat.'],
    ['Orbit', '3D identity', 'Mascots with react-three-fiber: portal entrance, head and eye tracking.'],
    ['Server', 'Backend', 'Express + MySQL API; the database starts empty by design.'],
    ['KeyRound', 'Accounts', 'Email confirmation, password reset, Google / LinkedIn / GitHub, owner-set roles.'],
    ['Workflow', 'Workflows', 'Promotions, formation requests, course content, the review queue.'],
    ['Radio', 'Realtime', 'Live notifications over SSE; chat keyed by account.'],
    ['Sparkles', 'Polish', 'Themes, cursor, section backgrounds, emblem logo, loading screen, card system.'],
    ['Newspaper', 'Social', 'Feed, posts with images, likes, comments, follows, public profiles.'],
    ['ShieldCheck', 'Hardening', 'Role rules for formations, security checks, 35 end-to-end tests.'],
  ]
  return `<div class="inner dots">
    ${eyebrow('12 — Project journey')}
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:22px"><h2 class="h1">How it was built.</h2><span class="note">Order of work · dates were not recorded</span></div>
    <div style="display:grid;grid-template-columns:repeat(9,1fr);gap:16px;margin-top:150px;position:relative">
      <div style="position:absolute;left:36px;right:36px;top:37px;height:3px;background:linear-gradient(90deg,var(--sky),var(--blue),var(--indigo),var(--good));border-radius:3px"></div>
      ${phases.map(([ic, t, s], i) => `<div style="position:relative">${tile(ic, { size: 76, tone: i === phases.length - 1 ? 'good' : '' })}<div class="mono" style="margin-top:26px;color:var(--blue)">${String(i + 1).padStart(2, '0')}</div><div class="h4" style="margin-top:10px;font-size:27px">${t}</div><div class="small" style="margin-top:10px;font-size:17px">${s}</div></div>`).join('')}
    </div>
    <div class="card abs" style="left:120px;right:120px;bottom:100px;padding:22px 30px;display:flex;gap:22px;align-items:center">
      ${tile('Rocket', { size: 46, tone: 'warn', soft: true })}
      <div class="small" style="color:var(--ink);font-size:19px">${content.api ? `Live on free tiers: the UI on Vercel (${fact('demo')}), the API on Render and MySQL 8.4 on Aiven. Next on the path: the social sign-in callbacks and always-on hosting.` : content.demo ? `The UI is live on Vercel with demo data: ${fact('demo')}. Next on the path: hosting the API and the database (Railway / Render).` : `Next on the path: deployment — configuration is ready (Vercel for the UI, Railway / Render for the API). ${fact('demo', 'live URL, if deployed')}`}</div>
    </div>
  </div>`
})

// 25–26 — 13 Challenges
add('13 · Challenges & solutions', () => `<div class="inner">
  ${eyebrow('13 — Challenges & solutions')}
  <h2 class="h2" style="margin-top:20px">Real problems, and how they were solved.</h2>
  <div style="display:grid;gap:22px;margin-top:36px">
    ${challenge(1, 'Live notifications without headers', ['Notifications had to arrive instantly, not on the next 20-second poll.', 'The browser’s EventSource can’t send an Authorization header; every other route uses Bearer tokens.', 'Server-Sent Events on /api/notifications/stream, authenticated by the JWT in its query string.', 'A hub publishes to each user’s open streams when a notification is written; retry 5 s, ping 25 s.', 'Bells and pop-ups update at once; polling stays as a fallback; an end-to-end test covers it.'], 'Radio', 'sky')}
    ${challenge(2, 'Video lessons behind a login', ['Course videos must play and seek in a native &lt;video&gt; element.', 'Media elements can’t attach the Bearer token either.', 'Make the URL itself the key.', 'Random 128-bit file names, served statically; HTML, SVG and scripts refused; URLs only for staff and enrolled learners.', 'Native streaming and seeking, no proxy.'], 'Video', 'indigo')}
    ${challenge(3, 'A chat both sides can answer', ['A manager could message an employee, but the employee couldn’t reply.', 'Conversations were keyed by team-member rows; staff outside a team had none.', 'Key every conversation by account.', 'Contacts computed per role; messages store sender and recipient user ids; replies notify.', 'Two-way chat for every pair allowed to talk, with tests for the rules.'], 'MessagesSquare', 'good')}
  </div>
</div>`, { variant: 'white' })
add('13 · Challenges & solutions', () => `<div class="inner">
  ${eyebrow('13 — Challenges & solutions')}
  <div style="display:grid;gap:22px;margin-top:40px">
    ${challenge(4, 'Approvals that never get stuck', ['A formation request stayed invisible to the manager while it waited for HR.', 'The workflow assumed HR always acts first — not true in a team without HR yet.', 'Keep HR as the first stage, let managers decide at any stage.', 'The manager queue includes pending and on-hold; HR can act on pending only; each decision notifies.', 'Nothing blocks when a role is missing; covered by tests.'], 'Workflow', 'warn')}
    ${challenge(5, 'A 3D character with a frozen coat', ['The Rick model’s lab coat didn’t follow the body.', 'The file ships in one pose with no animations, and the coat isn’t skinned.', 'Rig it at load time.', 'The coat is bound to the spine and arm bones when the model loads; all motion is procedural.', 'A character that reacts to the interface without animation clips.'], 'Orbit', 'violet')}
    ${challenge(6, 'Recovering the local database', ['After an unclean shutdown, MariaDB refused to start.', 'Its Aria recovery log was corrupted, so the system tables couldn’t load.', 'Back up first; change nothing irreversible.', 'Full data backup, damaged logs quarantined, aria_chk safe-recover and zerofill on 24 system tables.', 'Every database intact; a checklist: stop MySQL before shutting down.'], 'Database', 'ink')}
  </div>
</div>`, { variant: 'white' })

// 27 — 14 Quality & performance
add('14 · Quality & performance', () => {
  const bars = [['Main bundle (JS)', 1582.8, 451.6], ['3D engine chunk (lazy)', 911.2, 241.7], ['Stylesheet', 114.2, 23.1], ['Demo media (lazy)', 79.7, 52.8], ['glTF loader (lazy)', 70.4, 20.6]]
  const max = 1562.5
  return `<div class="inner dots">
    ${eyebrow('14 — Quality & performance')}
    <h2 class="h1" style="margin-top:22px">Measured, not guessed.</h2>
    <div class="grid4" style="margin-top:44px">
      ${[['35', 'end-to-end API tests, all passing', 'good'], ['70', 'API route handlers', ''], ['23', 'database tables', 'sky'], ['0', 'invented metrics in this book', 'violet']].map(([v, l, tone]) => `<div class="card stat" style="padding:28px 30px"><b class="${tone ? '' : 'grad'}" style="${tone ? `color:var(--${tone === 'sky' ? 'blue' : tone})` : ''}">${v}</b><small>${l}</small></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:28px;margin-top:28px">
      <div class="card" style="padding:28px 32px">
        <div style="display:flex;justify-content:space-between"><div class="h4">Production build</div><span class="mono">raw · gzip (kB)</span></div>
        <div style="display:grid;gap:14px;margin-top:22px">${bars.map(([l, raw, gz]) => `<div style="display:grid;grid-template-columns:230px 1fr 150px;gap:16px;align-items:center">
          <span style="font-size:16px">${l}</span>
          <div style="height:14px;background:rgba(47,123,246,.1);border-radius:0 4px 4px 0;position:relative"><div style="position:absolute;left:0;top:0;bottom:0;width:${(raw / max) * 100}%;background:rgba(47,123,246,.35);border-radius:0 4px 4px 0"></div><div style="position:absolute;left:0;top:0;bottom:0;width:${(gz / max) * 100}%;background:var(--blue);border-radius:0 4px 4px 0"></div></div>
          <span style="font-family:var(--f-mono);font-size:13px;text-align:right">${raw.toLocaleString('en')} · <b>${gz}</b></span></div>`).join('')}</div>
        <div class="small" style="margin-top:20px;font-size:15.5px">3D models: 21.0 MB (Rick) and 0.21 MB (emblem), loaded only where they appear. Not measured: Lighthouse scores and API latency.</div>
      </div>
      <div class="card" style="padding:28px 32px">
        <div class="h4">Optimisation strategy</div>
        ${ticks(['<b>Code splitting:</b> the 3D engine and the Skills page load on demand', '<b>Render on demand:</b> the logo draws once, not every frame', '<b>Frame budget:</b> ~40 fps canvases, paused in hidden tabs', '<b>Uploads shrink first:</b> images resized to 1600 px in the browser', '<b>Paged feed:</b> 20 posts at a time; each author sent once', '<b>Next:</b> compress the 21 MB model, import only the icons in use'], 'margin-top:18px;gap:11px')}
      </div>
    </div>
  </div>`
})

// 28 — 15 Security
add('15 · Security', () => {
  const items = [
    ['Lock', 'Passwords', 'bcrypt with cost 10; never returned by the API'],
    ['KeyRound', 'Sessions', 'JWT (7 days); the role is re-read from the database on every request'],
    ['MailCheck', 'Email links', 'Random tokens stored as SHA-256, single use, 24 h / 60 min'],
    ['ShieldCheck', 'OAuth', 'Signed 10-minute state; new accounts start as employees'],
    ['Gauge', 'Rate limiting', '30 requests / 15 min per client on /api/auth'],
    ['Braces', 'Input & SQL', 'Length and id validation; parameterised queries through mysql2'],
    ['FileLock2', 'Uploads', 'Random names; HTML, SVG, scripts refused; image signatures checked; CVs read in memory, never saved'],
    ['Eye', 'Privacy', 'Salaries and promotion files: staff and the employee concerned only; team ratings stay private'],
  ]
  return `<div class="inner grid-tex">
    ${eyebrow('15 — Security')}
    <h2 class="h1" style="margin-top:22px;color:#fff">Safe by default.</h2>
    <div class="grid4" style="margin-top:50px">
      ${items.map(([ic, t, s]) => `<div class="card" style="padding:28px 26px;min-height:230px">${tile(ic, { size: 54, tone: 'sky' })}<div class="h4" style="margin-top:20px;color:#fff">${t}</div><div class="small" style="margin-top:8px;font-size:16.5px">${s}</div></div>`).join('')}
    </div>
    <div class="card abs" style="left:120px;right:120px;bottom:100px;padding:20px 28px;display:flex;gap:18px;align-items:center">
      ${tile('FileKey2', { size: 42, tone: 'warn', soft: true })}<div class="small" style="color:#fff;font-size:18px">Secrets (database, JWT, SMTP, OAuth) live in a git-ignored .env; CORS allows only the configured frontend; responses send nosniff.</div>
    </div>
  </div>`
}, { variant: 'night' })

// 29–31 — 16 Showcase
add('16 · Showcase', () => `
  <div class="glow" style="width:1200px;height:800px;left:360px;top:260px;background:rgba(47,123,246,.45)"></div>
  <div class="abs" style="left:120px;top:150px">${eyebrow('16 — Showcase')}<h2 class="h1" style="margin-top:20px;color:#fff">Frost, by default.</h2></div>
  <div class="abs" style="left:290px;top:340px;width:1340px;perspective:2600px"><div style="transform:rotateX(14deg);transform-origin:50% 0">${win('dashboard-manager', { route: '/', width: 1340 })}</div></div>`, { variant: 'night' })
add('16 · Showcase', () => {
  const t = [['dashboard-employee', 'Frost'], ['dashboard-employee-ember', 'Ember'], ['dashboard-employee-light', 'Light']]
  return `<div class="inner">
    <div style="display:flex;justify-content:space-between;align-items:flex-end">${`<div>${eyebrow('16 — Showcase')}<h2 class="h1" style="margin-top:20px">One app, three moods.</h2></div>`}<p class="lead" style="max-width:520px;font-size:24px">Themes change every token — surfaces, shadows, charts, backgrounds, the logo’s tint — never the layout.</p></div>
    ${[[t[1], 120, 420, 700, 1], [t[2], 1100, 420, 700, 1], [t[0], 470, 360, 980, 2]].map(([[s, l], x, y, w, z]) => `<div style="position:absolute;left:${x}px;top:${y}px;z-index:${z}">${win(s, { route: `/ · ${l}`, width: w })}<div class="shot-cap">${l}</div></div>`).join('')}
    </div>`
}, { variant: 'white' })
add('16 · Showcase', () => `<div class="inner dots">
  <div style="position:absolute;left:120px;top:150px">${eyebrow('16 — Showcase')}<h2 class="h1" style="margin-top:20px">People, not just records.</h2></div>
  <div style="position:absolute;left:120px;top:380px">${win('feed', { route: '/feed', width: 900 })}</div>
  <div style="position:absolute;left:1080px;top:230px;transform:rotate(1.2deg)">${win('public-profile', { route: '/u/3', width: 720 })}</div>
  <div style="position:absolute;left:1180px;top:690px;transform:rotate(-1.5deg)">${win('team-hub', { route: '/team', width: 620 })}</div>
</div>`)

// 32 — 17 Conclusion
add('17 · Conclusion', () => `<div class="inner">
  ${eyebrow('17 — Conclusion')}
  <h2 class="h1" style="margin-top:22px">What was built, and what’s next.</h2>
  <div class="grid3" style="margin-top:44px">
    <div class="card" style="padding:30px">${tile('Boxes', { size: 52 })}<div class="h3" style="margin-top:20px">Built</div>${ticks(['A full-stack workspace: React SPA + Express API + MySQL', '13 pages, 70 API handlers, 23 tables', 'Two-stage approvals, live notifications, a social layer, a CV coach', '35 end-to-end tests against a real database'], 'margin-top:16px;gap:10px')}</div>
    <div class="card" style="padding:30px">${tile('Lightbulb', { size: 52, tone: 'warn' })}<div class="h3" style="margin-top:20px">Learned</div>${ticks(['Model the data before the screens', 'Workflows need escape hatches for missing roles', 'Browsers shape auth: streams and media can’t send headers', 'Motion needs budgets and an off switch'], 'margin-top:16px;gap:10px')}</div>
    <div class="card" style="padding:30px">${tile('Award', { size: 52, tone: 'good' })}<div class="h3" style="margin-top:20px">Achievements</div>${ticks(['Email-confirmed accounts plus three OAuth providers', 'SSE push with a polling fallback', 'Procedurally animated 3D in the interface', 'A demo mode that runs the whole UI offline'], 'margin-top:16px;gap:10px')}</div>
  </div>
  <div class="abs" style="left:120px;right:120px;bottom:100px;border:2px dashed rgba(47,123,246,.45);border-radius:28px;padding:26px 32px;background:rgba(47,123,246,.04)">
    <div style="display:flex;gap:16px;align-items:center"><span class="chip" style="font-family:var(--f-mono);letter-spacing:.14em;font-size:14px">FUTURE ROADMAP</span><span class="small">Not built yet — planned improvements</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px 28px;margin-top:18px">
      ${['Skills history table for a true timeline', 'Chat reactions and replies saved on the server', 'Compressed 3D models and leaner icon imports', 'Deployment with CI running the test suite', 'Accessibility and Lighthouse audit', 'Notification preferences per person', 'Original mascots for public use', 'Route-level code splitting'].map((r) => `<div style="display:flex;gap:10px;align-items:center;font-size:17px">${icon('Circle', 12, 3)}${r}</div>`).join('')}
    </div>
  </div>
</div>`, { variant: 'white' })

// 33 — Final page
add('Final', () => {
  const link = (ic, label, key, what) => `<div class="card" style="padding:26px 28px;display:flex;gap:20px;align-items:center;min-width:430px">
    ${content[key] ? `<div class="qr" data-qr="${key === 'contact' && /^[^@\s]+@[^@\s]+$/.test(content[key]) ? `mailto:${content[key]}` : content[key]}" style="width:96px;height:96px;background:#fff;border-radius:12px;padding:6px"></div>` : `<div style="width:96px;height:96px;border-radius:16px;border:2px dashed rgba(255,255,255,.45);display:grid;place-items:center;color:rgba(255,255,255,.7)">${icon('QrCode', 40)}</div>`}
    <div><div class="mono" style="color:rgba(255,255,255,.75)">${label}</div><div style="margin-top:8px;font-size:19px;font-weight:600">${fact(key, what)}</div></div></div>`
  return `
  <div class="glow" style="width:1000px;height:1000px;left:-300px;top:-400px;background:rgba(255,255,255,.18)"></div>
  <div class="abs" style="left:120px;top:150px">
    ${wordmark(210, '#fff')}
    <div class="h2" style="margin-top:36px;color:#fff;font-size:72px">Grow on purpose.</div>
    <p class="lead" style="margin-top:22px;max-width:860px;font-size:26px">Formations, promotions, reviews, a CV coach, chat and a feed — one workspace for the people growing and the people deciding.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:30px;max-width:1000px">${[`React ${ver('react')}`, `Vite ${ver('vite')}`, `Three.js ${ver('three')}`, `Framer Motion ${ver('framer-motion')}`, `Express ${ver('express')}`, 'MariaDB / MySQL', 'JWT · OAuth 2.0', 'Server-Sent Events'].map((c) => `<span class="chip">${c}</span>`).join('')}</div>
  </div>
  <div class="abs" style="left:120px;bottom:120px;display:flex;gap:24px;color:#fff">
    ${link('Github', 'GitHub', 'github', 'repository URL')}${link('Globe', content.api ? 'Live app' : 'Live demo', 'demo', 'live URL')}${link('Mail', 'Contact', 'contact', 'email or site')}
  </div>
  <div class="abs" style="right:120px;top:160px;text-align:right;color:#fff">
    <div class="mono" style="color:rgba(255,255,255,.75)">Author</div><div class="h3" style="margin-top:10px;color:#fff">${fact('author')}</div>
    <div class="mono" style="color:rgba(255,255,255,.75);margin-top:30px">Year</div><div class="h3" style="margin-top:10px;color:#fff">${fact('year')}</div>
  </div>
  <div class="abs" style="right:120px;bottom:60px;max-width:760px;text-align:right;font-size:13px;line-height:1.6;color:rgba(255,255,255,.7)">3D models “rick” by Rached.Abdelkhalek and “Rick and Morty” by Ian Dowson, Sketchfab, CC-BY-4.0 (the licence covers the models, not the characters). Icons: Lucide (ISC), Simple Icons (CC0). Screens use the app’s built-in demo data.</div>`
}, { variant: 'hero dots', bare: true })

// ---------- assemble ----------
export function buildBook() {
  const total = defs.length
  const toc = []
  let last = ''
  defs.forEach((d, i) => {
    const m = d.section.match(/^(\d\d) · (.+)$/)
    if (m && m[1] !== last) { toc.push([m[1], m[2], i + 1]); last = m[1] }
  })
  const ctx = { toc, total }
  return defs.map((d, i) => page({ n: d.bare ? 0 : i + 1, total, section: d.section, variant: d.variant ?? '', body: d.render(ctx), id: `p${i + 1}` }))
}
export const pageCount = () => defs.length
/** The page number of a section's nth page, so the kit finds pages by name and survives new pages. */
export function pageOf(section, nth = 0) {
  const hits = defs.flatMap((d, i) => (d.section === section ? [i + 1] : []))
  if (hits[nth] == null) throw new Error(`No page ${nth} in section "${section}"`)
  return hits[nth]
}
