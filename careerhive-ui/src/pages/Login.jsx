import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { siGithub } from 'simple-icons'
import { api, apiAwake, DEMO, wake } from '../api/client'
import Logo, { BrandTitle } from '../components/Logo'
import { Icon, Tabs } from '../components/ui'
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
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const switchMode = (m) => { setMode(m); setError(null); setNotice(null); setUnconfirmed(false) }

  // Returning from social sign-in or an emailed link: the store reads the result from the URL just after this page
  // first renders, so pick its message up when it arrives.
  useEffect(() => { if (state.authError) setError(state.authError) }, [state.authError])
  useEffect(() => { if (state.authNotice) setNotice(state.authNotice) }, [state.authNotice])

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

  // wait until the API is up before leaving, so a sleeping server shows our message instead of Render's holding page
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
    <div className="stage">
      <div className="frame auth-frame">
        <section className="auth-art">
          <div className="auth-canvas mascot-stage">{!softwareGL() && <Suspense fallback={null}><Mascot variant="wave" distance={8.4} vortex={state.theme === 'frost' ? ['#8fe3ff', '#5b7cff'] : ['#ffd166', '#ff5e8a']} accent={state.theme === 'frost' ? '#2f5bff' : '#1f2a44'} /></Suspense>}</div>
          <span className="glyph" style={{ fontSize: 320, right: -40, bottom: -60, color: 'rgba(255,255,255,.07)' }}>昇</span>
          <div className="auth-copy">
            <div className="brand stacked start" style={{ padding: 0 }}>
              <Logo theme={state.theme} tone="white" />
              <BrandTitle />
              <div className="brand-sub" style={{ color: 'rgba(255,255,255,.7)' }}>Workspace</div>
            </div>
            <div className="auth-headline">
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                Grow on<br />purpose.
              </motion.h1>
              <p>Track your formations, earn certifications, and ask for the promotion when you have earned it.</p>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <button className="icon-btn" style={{ position: 'absolute', top: 20, right: 20 }} aria-label={`Switch to ${nextTheme(state.theme).label}`} title={`Switch to ${nextTheme(state.theme).label}`} onClick={() => actions.setTheme(nextTheme(state.theme).id)}>
            <Icon name={nextTheme(state.theme).icon} size={18} />
          </button>
          {sent ? (
            <motion.div className="auth-sent" key={`sent-${sent.kind}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <div className="auth-sent-icon"><Icon name={sent.kind === 'reset' ? 'KeyRound' : 'MailCheck'} size={28} /></div>
              <div className="eyebrow">Check your inbox</div>
              <h2>{sent.kind === 'reset' ? 'Reset link on its way' : 'Confirm your email'}</h2>
              <p>
                We sent a link to <b>{sent.email}</b>.{' '}
                {sent.kind === 'reset' ? 'Open it to choose a new password. It works for 1 hour.' : 'Open it to activate your account; you will be signed in right away. It works for 24 hours.'}
              </p>
              {sent.warning && <div className="form-error"><Icon name="CircleAlert" size={16} />{sent.warning}</div>}
              {error && <div className="form-error"><Icon name="CircleAlert" size={16} />{error}</div>}
              <div className="auth-sent-actions">
                {sent.kind === 'verify' && <button type="button" className="btn ghost" disabled={cooldown} onClick={resend}><Icon name="Send" size={15} />{cooldown ? 'Sent — check spam too' : 'Resend the link'}</button>}
                <button type="button" className="btn" onClick={() => { setSent(null); switchMode('login') }}>Back to sign in <Icon name="ArrowRight" size={16} /></button>
              </div>
            </motion.div>
          ) : (
          <motion.form onSubmit={submit} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div className="eyebrow">{{ login: 'Welcome back', signup: 'Create account', forgot: 'Forgot password', reset: 'Almost there' }[mode]}</div>
            <h2>{{ login: 'Sign in to your space', signup: 'Join your team', forgot: 'Reset your password', reset: 'Choose a new password' }[mode]}</h2>
            {(mode === 'login' || mode === 'signup') && (
              <Tabs id="auth" value={mode} onChange={switchMode} items={[{ value: 'login', label: 'Sign in' }, { value: 'signup', label: 'Sign up' }]} />
            )}
            {mode === 'forgot' && <p className="auth-hint">Enter your account’s email and we’ll send you a link to choose a new password.</p>}

            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div className="field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label>Full name</label>
                  <input className="input" required value={form.name} onChange={on('name')} placeholder="Hamzaoui" />
                </motion.div>
              )}
            </AnimatePresence>
            {mode !== 'reset' && (
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" required value={form.email} onChange={on('email')} placeholder="hamzaoui@company.com" autoComplete="email" />
              </div>
            )}
            {mode !== 'forgot' && (
              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label htmlFor="auth-password">{mode === 'reset' ? 'New password' : 'Password'}</label>
                  {mode === 'login' && !DEMO && <button type="button" className="nlink" style={{ padding: 0 }} onClick={() => switchMode('forgot')}>Forgot password?</button>}
                </div>
                <div style={{ position: 'relative' }}>
                  <input id="auth-password" className="input" type={show ? 'text' : 'password'} required minLength={mode === 'login' ? undefined : 8} value={form.password} onChange={on('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? '' : 'At least 8 characters'} />
                  <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--dim)' }} aria-label="Show password"><Icon name={show ? 'EyeOff' : 'Eye'} size={18} /></button>
                </div>
              </div>
            )}
            {mode === 'reset' && (
              <div className="field">
                <label>Repeat the new password</label>
                <input className="input" type={show ? 'text' : 'password'} required minLength={8} value={form.confirm} onChange={on('confirm')} autoComplete="new-password" />
              </div>
            )}
            {mode === 'signup' && DEMO && (
              <div className="field">
                <label>I am joining as</label>
                <select className="input" value={form.role} onChange={on('role')}>
                  <option value="student">Employee</option><option value="manager">Manager</option><option value="hr">HR</option>
                </select>
              </div>
            )}
            {notice && <div className="form-ok"><Icon name="CircleCheck" size={16} />{notice}</div>}
            {error && (
              <div className="form-error">
                <Icon name="CircleAlert" size={16} />
                <span style={{ flex: 1 }}>{error}</span>
                {unconfirmed && <button type="button" className="nlink" disabled={cooldown} onClick={resend}>{cooldown ? 'Sent' : 'Resend the link'}</button>}
              </div>
            )}
            <button className="btn" disabled={busy} style={{ width: '100%', padding: 14 }}>
              {busy ? 'Please wait…' : { login: 'Sign in', signup: 'Create account', forgot: 'Send the reset link', reset: 'Save and sign in' }[mode]} <Icon name="ArrowRight" size={16} />
            </button>
            {(mode === 'forgot' || mode === 'reset') && (
              <button type="button" className="nlink" style={{ justifySelf: 'center' }} onClick={() => { if (mode === 'reset') window.history.replaceState({}, '', '/'); switchMode('login') }}>
                <Icon name="ArrowLeft" size={14} />Back to sign in
              </button>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="or"><span>or continue with</span></div>
                <div className="oauth">
                  {PROVIDERS.map((p) => (
                    <button key={p.id} type="button" className="btn ghost" onClick={() => oauth(p.id)} disabled={!!waking && waking !== p.id} aria-busy={waking === p.id} aria-label={`Continue with ${p.label}`}>{p.icon}{waking === p.id ? 'Connecting…' : p.label}</button>
                  ))}
                </div>
                {(busy || waking) && !apiAwake() && <p className="auth-hint" role="status" style={{ marginTop: 10 }}>Waking up the server — after a quiet spell this takes up to a minute.</p>}
              </>
            )}

            {DEMO && (
              <div className="demo-box">
                <Icon name="Info" size={16} />
                <div>
                  <b>Demo mode</b> — no backend connected. Try a role:
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {DEMO_ACCOUNTS.map((a) => (
                      <button type="button" key={a.label} className={`chip ${form.email === a.email ? 'accent' : ''}`} onClick={() => { setMode('login'); setForm({ ...form, email: a.email, password: 'demo1234' }) }}>{a.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.form>
          )}
        </section>
      </div>
    </div>
  )
}
