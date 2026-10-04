import { app } from './app.js'
import { config } from './config.js'
import { pool } from './db.js'

// Warn, but keep serving: exiting would make Render restart the API in a loop (visitors stuck on its holding page)
// whenever the database is down, e.g. Aiven's free plan powered off. Requests answer 503 until it is back.
pool.query('SELECT 1').catch((e) => {
  console.error(`Cannot reach MySQL at ${config.db.host}:${config.db.port} (database "${config.db.database}"): ${e.message}`)
  console.error('Start MySQL, check DB_* in .env, then run `npm run db:setup` once.')
})

const server = app.listen(config.port, () => {
  console.log(`CareerHive API on http://localhost:${config.port} (database "${config.db.database}", CORS: ${config.corsOrigins.join(', ')})`)
})

const stop = () => server.close(() => pool.end().then(() => process.exit(0)))
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
