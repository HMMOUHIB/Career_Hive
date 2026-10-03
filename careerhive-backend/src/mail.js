// Outgoing email (confirmation and password-reset links) over SMTP.
// Without SMTP_HOST the message is printed in the API console, so links still work in development.
import nodemailer from 'nodemailer'
import { config } from './config.js'

export const outbox = [] // the last messages, for tests and debugging
let transport

export async function sendMail({ to, subject, text, html }) {
  outbox.push({ to, subject, text, html })
  if (outbox.length > 50) outbox.shift()
  if (!config.smtp.host) {
    if (process.env.NODE_ENV !== 'test') console.log(`\n[mail] SMTP is not configured, so this was not sent. To: ${to}\n[mail] ${subject}\n${text}\n`)
    return
  }
  transport ??= nodemailer.createTransport({
    host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  })
  try {
    await transport.sendMail({ from: config.mailFrom, to, subject, text, html })
  } catch (e) {
    // e.g. a wrong app password: outside production, still show the link so nobody is locked out while testing
    if (!config.production) console.log(`\n[mail] sending failed (${e.message}). The message was:\nTo: ${to}\n${subject}\n${text}\n`)
    throw e
  }
}

const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function layout({ name, intro, button, url, outro }) {
  return `<!doctype html><html><body style="margin:0;background:#f6ecea;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#2a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden">
      <tr><td style="background:linear-gradient(125deg,#ec6a55,#c8403f 45%,#8e2231);background-color:#c8403f;padding:26px 30px;color:#ffffff">
        <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.85">CareerHive</div>
        <div style="font-size:24px;font-weight:700;margin-top:6px">${escape(button)}</div>
      </td></tr>
      <tr><td style="padding:28px 30px;font-size:15px;line-height:1.6">
        <p style="margin:0 0 14px">Hi ${escape(name)},</p>
        <p style="margin:0 0 22px">${intro}</p>
        <p style="margin:0 0 22px"><a href="${escape(url)}" style="display:inline-block;background:#e8453c;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:12px">${escape(button)}</a></p>
        <p style="margin:0 0 8px;font-size:13px;color:#7a6262">${outro}</p>
        <p style="margin:0;font-size:12px;color:#9a8585;word-break:break-all">${escape(url)}</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`
}

export const verificationEmail = (name, url) => ({
  subject: 'Confirm your email to start using CareerHive',
  text: `Hi ${name},\n\nConfirm your email to activate your CareerHive account:\n${url}\n\nThe link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
  html: layout({ name, url, button: 'Confirm my email', intro: 'Welcome to CareerHive! Confirm your email address to activate your account. You will be signed in right away.', outro: 'The link expires in 24 hours. If you didn’t create an account, you can ignore this email.' }),
})

export const resetEmail = (name, url) => ({
  subject: 'Reset your CareerHive password',
  text: `Hi ${name},\n\nChoose a new password for your CareerHive account:\n${url}\n\nThe link expires in 1 hour. If you didn't ask for this, you can ignore this email; your password stays the same.`,
  html: layout({ name, url, button: 'Choose a new password', intro: 'Someone (hopefully you) asked to reset the password of your CareerHive account.', outro: 'The link expires in 1 hour. If you didn’t ask for this, ignore this email; your password stays the same.' }),
})
