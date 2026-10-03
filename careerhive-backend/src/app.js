import fs from 'node:fs'
import cors from 'cors'
import express from 'express'
import { requireAuth } from './auth.js'
import { config } from './config.js'
import { q } from './db.js'
import { HttpError } from './http.js'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import cvRoutes from './routes/cv.js'
import dashboardRoutes from './routes/dashboard.js'
import formationRoutes from './routes/formations.js'
import notificationRoutes, { stream } from './routes/notifications.js'
import promotionRoutes from './routes/promotions.js'
import resourceRoutes from './routes/resources.js'
import skillRoutes from './routes/skills.js'
import socialRoutes from './routes/social.js'
import teamRoutes from './routes/teams.js'
import userRoutes from './routes/users.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1) // behind Railway / Render / nginx: real client IPs for rate limiting

app.use(cors({ origin: config.corsOrigins, maxAge: 86400 }))
app.use(express.json({ limit: '12mb' })) // profile and cover photos arrive as base64
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next() })

// uploaded course files; names are random, so the URL is the key
fs.mkdirSync(config.uploadDir, { recursive: true })
app.use('/uploads', express.static(config.uploadDir, { fallthrough: false, maxAge: '7d', index: false }))

app.get('/api/health', async (req, res) => {
  await q('SELECT 1')
  res.json({ ok: true, time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.get('/api/notifications/stream', stream) // authenticates with ?token= (EventSource can't send headers)
app.use('/api', requireAuth, dashboardRoutes, userRoutes, skillRoutes, teamRoutes, chatRoutes, promotionRoutes, formationRoutes, resourceRoutes, notificationRoutes, socialRoutes, cvRoutes)

app.use('/api', (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }))

// errors → { message }, the shape the UI shows in its toasts
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  let status = err.status ?? err.statusCode ?? 500
  let message = err.message
  if (err.name === 'MulterError') {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    message = err.code === 'LIMIT_FILE_SIZE' ? `Files must be under ${config.maxUploadMb} MB.` : err.message
  } else if (err.type === 'entity.too.large') {
    message = 'Request too large (photos must be under 6 MB).'
  } else if (err.type === 'entity.parse.failed') {
    message = 'Malformed JSON body.'
  } else if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err)
    message = 'Something went wrong on our side. Please try again.'
  }
  res.status(status).json(err instanceof HttpError && err.code ? { message, code: err.code } : { message })
})
