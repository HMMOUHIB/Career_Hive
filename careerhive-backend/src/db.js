import mysql from 'mysql2/promise'
import { config } from './config.js'

export const pool = mysql.createPool({
  ...config.db,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE → 'YYYY-MM-DD', DATETIME → 'YYYY-MM-DD HH:MM:SS' (UTC, see below); no JS Date shifting
  decimalNumbers: true,
  timezone: 'Z',
})
// store and compare every DATETIME in UTC, whatever the server's own time zone is
pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"))

/** Run a query and return its rows (or the result header for writes). `?` placeholders expand arrays for IN (?). */
export const q = async (sql, params) => (await pool.query(sql, params))[0]
/** First row, or null. */
export const one = async (sql, params) => (await q(sql, params))[0] ?? null

/** Run `fn` in a transaction; it receives a `q` bound to the transaction's connection. */
export async function tx(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(async (sql, params) => (await conn.query(sql, params))[0])
    await conn.commit()
    return result
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
