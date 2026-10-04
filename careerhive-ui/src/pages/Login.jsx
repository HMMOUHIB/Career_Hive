import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { siGithub } from 'simple-icons'
import { api, apiAwake, DEMO, wake } from '../api/client'
import Logo, { BrandTitle } from '../components/Logo'
import { Icon, Tabs } from '../components/ui'
import { DUR, EASE, gsap, reducedMotion, useGSAP } from '../motion/gsap'
import Presence from '../motion/Presence'
import { nextTheme, useStore } from '../store/store'
import { softwareGL } from '../three/gpu'

const Mascot = lazy(() => import('../three/Mascot'))

// Brand marks for social sign-in (LinkedIn isn't in simple-icons, so its "in" mark is inlined).
const PROVIDERS = [
  { id: 'linkedin', label: 'LinkedIn', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" /></svg> },
  { id: 'github', label: 'GitHub', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d={siGithub.path} /></svg> },
  {
    id: 'google', label: 'Google', icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
    ),
  },
]

/** A password-reset link opens the app at /reset-password?reset=… */
const resetCode = () => (window.location.pathname === '/reset-password' ? new URLSearchParams(window.location.search).get('reset') : null)

const DEMO_ACCOUNTS = [
  { label: 'Employee', email: 'amine@careerhive.tn' },
  { label: 'HR', email: 'hr@careerhive.tn' },
  { label: 'Manager', email: 'manager@careerhive.tn' },
]

const TITLES = {
  eyebrow: { login: 'Welcome back', signup: 'Create account', forgot: 'Forgot password', reset: 'Almost there' },
  heading: { login: 'Sign in to your space', signup: 'Join your team', forgot: 'Reset your password', reset: 'Choose a new password' },
  submit: { login: 'Sign in', signup: 'Create account', forgot: 'Send the reset link', reset: 'Save and sign in' },
}

/**
 * Sign in, sign up, forgot and reset password, social sign-in.
 * Motion — Purpose: the brand statement lands first, then the form comes forward.
 * Trigger: mount (one timeline); switching mode or showing "check your inbox" cross-fades the panel content.
 * Reduced motion: static.
 */
export default function Login() {
  const { state, actions } = useStore()
  const [reset] = useState(resetCode)
  const [mode, setMode] = useState(reset ? 'reset' : 'login') // login | signup | forgot | reset
  const [form, setForm] = useState({ name: '', email: DEMO ? DEMO_ACCOUNTS[0].email : '', password: DEMO ? 'demo1234' : '', confirm: '', role: 'student' })
  const [busy, setBusy] = useState(false)
  const [waking, setWaking] = useState(null) // the social provider waiting for the API to wake
  const [error, setError] = useState(state.authError)
  const [notice, setNotice] = useState(state.authNotice)
  const [unconfirmed, setUnconfirmed] = useState(false) // sign-in refused until the email is confirmed
  const [sent, setSent] = useState(null) // { kind: 'verify' | 'reset', email, warning? } → "check your inbox"
  const [cooldown, setCooldown] = useState(false)
  const [show, setShow] = useState(false)
  const root = useRef(null)
  const panel = useRef(null)
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const switchMode = (m) => { setMode(m); setError(null); setNotice(null); setUnconfirmed(false) }
  const next = nextTheme(state.theme)

  // Returning from social sign-in or an emailed link: the store reads the result from the URL just after this page
  // first renders, so pick its message up when it arrives.
  useEffect(() => { if (state.authError) setError(state.authError) }, [state.authError])
  useEffect(() => { if (state.authNotice) setNotice(state.authNotice) }, [state.authNotice])

  useGSAP(() => {
    if (reducedMotion()) return
    const tl = gsap.timeline({ defaults: { ease: EASE.out } })
    tl.from('.auth-art', { autoAlpha: 0, duration: DUR.slow })
      .from('.auth-headline h1 .line > span', { yPercent: 110, duration: DUR.slow, stagger: 0.08 }, 0.15)
      .from('.auth-headline p, .auth-proof li', { autoAlpha: 0, y: 12, duration: DUR.base, stagger: 0.06 }, 0.45)
      .from('.auth-panel-inner', { autoAlpha: 0, x: 24, duration: DUR.slow }, 0.25)
  }, { scope: root })

  // the panel content cross-fades when the mode changes or the inbox message shows
  useGSAP(() => {
    if (reducedMotion() || !panel.current) return
    gsap.fromTo(panel.current, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: DUR.base, ease: EASE.out })
  }, { dependencies: [sent?.kind, mode === 'forgot' || mode === 'reset'], revertOnUpdate: false })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null); setNotice(null); setUnconfirmed(false)
    try {
      if (mode === 'login') await actions.login(form.email, form.password)
      else if (mode === 'signup') {
        const r = await actions.signup(form.name, form.email, form.password, form.role)
        if (r?.verificationRequired) setSent({ kind: 'verify', email: r.email, warning: r.emailSent === false ? r.message : null })
      } else if (mode === 'forgot') {
        await api.forgotPassword(form.email)
        setSent({ kind: 'reset', email: form.email.trim() })
      } else if (mode === 'reset') {
        if (form.password !== form.confirm) throw new Error('The two passwords are different.')
        await actions.resetPassword(reset, form.password)
      }
    } catch (err) {
      setError(err.message)
      if (err.code === 'EMAIL_NOT_VERIFIED') setUnconfirmed(true)
    } finally { setBusy(false) }
  }

  const resend = async () => {
    setCooldown(true)
    setTimeout(() => setCooldown(false), 30000) // one email per 30 s
    try {
      await api.resendVerification(sent?.email ?? form.email)
      setSent({ kind: 'verify', email: sent?.email ?? form.email.trim() })
      setError(null); setUnconfirmed(false)
    } catch (err) { setError(err.message) }
  }

  // wait until the API is up before leaving, so a sleeping server shows our spinner instead of Render's holding page
  const oauth = async (p) => {
    const url = api.oauthUrl(p)
    if (!url) return setError('Social sign-in needs the real backend — set VITE_API_URL.')
    setWaking(p)
    try {
      await wake()
      window.location.href = url
    } catch (err) {
      setError(err.message)
      setWaking(null)
    }
  }

  return (
    <div className="auth" ref={root}>
      <section className="auth-art" aria-label="CareerHive">
        <div className="auth-stage">{!softwareGL() && <Suspense fallback={null}><Mascot variant="wave" distance={8.4} vortex={state.theme === 'light' ? ['#ffc58a', '#ffffff'] : ['#ffb36b', '#ff5b45']} accent="#1c1210" still={reducedMotion()} /></Suspense>}</div>
        <span className="glyph auth-glyph" aria-hidden="true">昇</span>
        <div className="auth-brand">
          <Logo theme={state.theme} tone="white" />
          <div className="brand-text"><BrandTitle /><span className="brand-sub">Workspace</span></div>
        </div>
        <div className="auth-headline">
          <h1><span className="line"><span>Grow on</span></span><span className="line"><span>purpose.</span></span></h1>
          <p>Track your formations, earn certifications, and ask for the promotion when you have earned it.</p>
          <ul className="auth-proof" role="list">
            <li><Icon name="GraduationCap" size={16} />Formations with real progress</li>
            <li><Icon name="ListChecks" size={16} />Promotion requirements, checked for you</li>
            <li><Icon name="Compass" size={16} />A CV coach that maps your gaps</li>
          </ul>
        </div>
      </section>

      <section className="auth-panel">
        <button type="button" className="icon-btn auth-theme" aria-label={`Switch to ${next.label} theme`} title={`${next.label} theme`} onClick={() => actions.setTheme(next.id)}>
          <Icon name={next.icon} size={17} />
        </button>
        <div className="auth-panel-inner">
          {sent ? (
            <div className="auth-sent" ref={panel} role="status">
              <div className="auth-sent-icon"><Icon name={sent.kind === 'reset' ? 'KeyRound' : 'MailCheck'} size={26} /></div>
              <div className="eyebrow">Check your inbox</div>
              <h2>{sent.kind === 'reset' ? 'Reset link on its way' : 'Confirm your email'}</h2>
              <p>
                We sent a link to <b>{sent.email}</b>.{' '}
                {sent.kind === 'reset' ? 'Open it to choose a new password. It works for 1 hour.' : 'Open it to activate your account; you will be signed in right away. It works for 24 hours.'}
              </p>
              {sent.warning && <div className="form-error"><Icon name="CircleAlert" size={16} />{sent.warning}</div>}
              {error && <div className="form-error" role="alert"><Icon name="CircleAlert" size={16} />{error}</div>}
              <div className="auth-sent-actions">
                {sent.kind === 'verify' && <button type="button" className="btn ghost" disabled={cooldown} onClick={resend}><Icon name="Send" size={15} />{cooldown ? 'Sent — check spam too' : 'Resend the link'}</button>}
                <button type="button" className="btn" onClick={() => { setSent(null); switchMode('login') }}>Back to sign in <Icon name="ArrowRight" size={16} /></button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} ref={panel} noValidate={false} aria-describedby={error ? 'auth-error' : undefined}>
              <div>
                <div className="eyebrow">{TITLES.eyebrow[mode]}</div>
                <h2>{TITLES.heading[mode]}</h2>
              </div>
              {(mode === 'login' || mode === 'signup') && (
                <Tabs label="Account" value={mode} onChange={switchMode} items={[{ value: 'login', label: 'Sign in' }, { value: 'signup', label: 'Sign up' }]} className="auth-tabs" />
              )}
              {mode === 'forgot' && <p className="auth-hint">Enter your account’s email and we’ll send you a link to choose a new password.</p>}

              <Presence show={mode === 'signup'} variant="rise" duration={0.35} appear={false}>
                <div className="field">
                  <label htmlFor="auth-name">Full name</label>
                  <input id="auth-name" className="input" required value={form.name} onChange={on('name')} placeholder="Hamzaoui" autoComplete="name" />
                </div>
              </Presence>
              {mode !== 'reset' && (
                <div className="field">
                  <label htmlFor="auth-email">Email</label>
                  <input id="auth-email" className="input" type="email" required value={form.email} onChange={on('email')} placeholder="hamzaoui@company.com" autoComplete="email" />
                </div>
              )}
              {mode !== 'forgot' && (
                <div className="field">
                  <div className="field-row">
                    <label htmlFor="auth-password">{mode === 'reset' ? 'New password' : 'Password'}</label>
                    {mode === 'login' && !DEMO && <button type="button" className="text-link" onClick={() => switchMode('forgot')}>Forgot password?</button>}
                  </div>
                  <div className="input-wrap">
                    <input id="auth-password" className="input" type={show ? 'text' : 'password'} required minLength={mode === 'login' ? undefined : 8} value={form.password} onChange={on('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? '' : 'At least 8 characters'} />
                    <button type="button" className="input-action" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}><Icon name={show ? 'EyeOff' : 'Eye'} size={17} /></button>
                  </div>
                </div>
              )}
              {mode === 'reset' && (
                <div className="field">
                  <label htmlFor="auth-confirm">Repeat the new password</label>
                  <input id="auth-confirm" className="input" type={show ? 'text' : 'password'} required minLength={8} value={form.confirm} onChange={on('confirm')} autoComplete="new-password" />
                </div>
              )}
              {mode === 'signup' && DEMO && (
                <div className="field">
                  <label htmlFor="auth-role">I am joining as</label>
                  <select id="auth-role" className="input" value={form.role} onChange={on('role')}>
                    <option value="student">Employee</option><option value="manager">Manager</option><option value="hr">HR</option>
                  </select>
                </div>
              )}
              {notice && <div className="form-ok" role="status"><Icon name="CircleCheck" size={16} />{notice}</div>}
              {error && (
                <div className="form-error" id="auth-error" role="alert">
                  <Icon name="CircleAlert" size={16} />
                  <span style={{ flex: 1 }}>{error}</span>
                  {unconfirmed && <button type="button" className="text-link" disabled={cooldown} onClick={resend}>{cooldown ? 'Sent' : 'Resend the link'}</button>}
                </div>
              )}
              <button className="btn lg block" disabled={busy} aria-busy={busy}>
                {TITLES.submit[mode]} <Icon name="ArrowRight" size={16} />
              </button>
              {(mode === 'forgot' || mode === 'reset') && (
                <button type="button" className="text-link center" onClick={() => { if (mode === 'reset') window.history.replaceState({}, '', '/'); switchMode('login') }}>
                  <Icon name="ArrowLeft" size={14} />Back to sign in
                </button>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <>
                  <div className="or"><span>or continue with</span></div>
                  <div className="oauth">
                    {PROVIDERS.map((p) => (
                      <button key={p.id} type="button" className="btn ghost" onClick={() => oauth(p.id)} disabled={!!waking && waking !== p.id} aria-busy={waking === p.id} aria-label={`Continue with ${p.label}`}>{p.icon}<span>{p.label}</span></button>
                    ))}
                  </div>
                  {(busy || waking) && !apiAwake() && <p className="auth-hint" role="status">Waking up the server — after a quiet spell this takes up to a minute.</p>}
                </>
              )}

              {DEMO && (
                <div className="demo-box">
                  <Icon name="Info" size={16} />
                  <div>
                    <b>Demo mode</b> — no backend connected. Try a role:
                    <div className="demo-roles">
                      {DEMO_ACCOUNTS.map((a) => (
                        <button type="button" key={a.label} className={`chip ${form.email === a.email ? 'accent' : ''}`} aria-pressed={form.email === a.email} onClick={() => { setMode('login'); setForm({ ...form, email: a.email, password: 'demo1234' }) }}>{a.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
