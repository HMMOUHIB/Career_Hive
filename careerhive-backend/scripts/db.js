// npm run db:setup  → create the database (if missing) and its tables: starts empty, 0 users
// npm run db:reset  → drop the database and create it again, empty (asks for --yes in production)
// npm run db:demo   → load the demo people, formations and requests into an empty database
import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import mysql from 'mysql2/promise'
import { config } from '../src/config.js'

const sqlFile = (name) => fs.readFile(new URL(`../sql/${name}`, import.meta.url), 'utf8')
const MIGRATIONS = [
  ['users', 'email_verified_at', 'DATETIME NULL AFTER email'],
]
// columns whose definition grew after a database was first created: [table, column, definition, text the new type contains]
const REDEFINE = [
  ['notifications', 'type', "ENUM('message', 'promotion', 'promoted', 'rejected', 'formation', 'review', 'info', 'social') NOT NULL DEFAULT 'info'", "'social'"],
]

export async function setupDatabase({ reset = false, demo = false, log = console.log } = {}) {
  const { database, ...server } = config.db
  const conn = await mysql.createConnection({ ...server, multipleStatements: true, charset: 'utf8mb4' })
  try {
    await conn.query("SET time_zone = '+00:00'")
    if (reset) {
      await conn.query(`DROP DATABASE IF EXISTS \`${database}\``)
      log(`dropped database ${database}`)
    }
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.query(`USE \`${database}\``)
    await conn.query(await sqlFile('schema.sql'))
    // columns added after a database was first created (CREATE TABLE IF NOT EXISTS won't add them)
    for (const [table, column, definition] of MIGRATIONS) {
      const [[{ n: has }]] = await conn.query('SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', [database, table, column])
      if (!has) {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`)
        log(`added ${table}.${column}`)
      }
    }
    for (const [table, column, definition, marker] of REDEFINE) {
      const [[row]] = await conn.query('SELECT column_type AS t FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', [database, table, column])
      if (row && !row.t.includes(marker)) {
        await conn.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${definition}`)
        log(`updated ${table}.${column}`)
      }
    }
    log(`schema ready in ${database}`)
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM users')
    if (demo && n === 0) {
      await conn.query(await sqlFile('seed.sql'))
      log('demo data loaded: sign in as amine@careerhive.tn, hr@careerhive.tn, manager@careerhive.tn or admin@careerhive.tn (password demo1234)')
    } else if (demo) {
      log(`demo data skipped: the database already has ${n} users (run db:reset first)`)
    } else {
      log(n ? `kept existing data (${n} users)` : 'empty database: open the app and sign up to create the first account')
    }
  } finally {
    await conn.end()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = process.argv[2]
  if (!['setup', 'reset'].includes(command)) {
    console.error('usage: node scripts/db.js setup|reset [--demo] [--yes]')
    process.exit(1)
  }
  if (command === 'reset' && config.production && !process.argv.includes('--yes')) {
    console.error(`Refusing to drop "${config.db.database}" in production without --yes`)
    process.exit(1)
  }
  setupDatabase({ reset: command === 'reset', demo: process.argv.includes('--demo') })
    .catch((e) => {
      console.error(`Database ${command} failed: ${e.message}`)
      process.exit(1)
    })
}
