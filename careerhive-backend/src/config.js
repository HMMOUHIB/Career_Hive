import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
try { process.loadEnvFile(path.join(root, '.env')) } catch { /* no .env file: use the real environment */ }

const env = process.env
const list = (v, fallback) => (v || fallback).split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
const port = Number(env.PORT) || 8000
const production = env.NODE_ENV === 'production'

export const config = {
  production,
  port,
  apiUrl: (env.API_URL || `http://localhost:${port}`).replace(/\/$/, ''), // public URL, used for OAuth callbacks
  frontendUrl: (env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  corsOrigins: list(env.CORS_ORIGINS, env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173'),
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  signupRoles: list(env.SIGNUP_ROLES, 'student'), // roles anyone may pick when signing up
  staffEmails: (env.STAFF_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean), // owners: become managers
  requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION !== 'false',
  // outgoing mail; without SMTP_HOST, emails are printed in the API's console instead
  smtp: {
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : Number(env.SMTP_PORT) === 465,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  mailFrom: env.MAIL_FROM || `CareerHive <${env.SMTP_USER || 'no-reply@careerhive.local'}>`,
  db: {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'careerhive',
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  },
  uploadDir: path.resolve(root, env.UPLOAD_DIR || 'uploads'),
  maxUploadMb: Number(env.MAX_UPLOAD_MB) || 500,
  timeZone: env.APP_TIMEZONE || 'Africa/Tunis', // for chat times like "11:05"
  oauth: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    linkedin: { clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET },
    github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
  },
}

if (!/^[A-Za-z0-9_]+$/.test(config.db.database)) throw new Error('DB_NAME may only contain letters, digits and _')
if (!config.jwtSecret) {
  if (production) throw new Error('JWT_SECRET must be set in production')
  config.jwtSecret = 'dev-only-secret-change-me'
  console.warn('[config] JWT_SECRET is not set: using an insecure development secret')
}
