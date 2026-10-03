// npm run user:role -- <email>            → show that account's role
// npm run user:role -- <email> <role>     → set it: student (employee) | manager | hr | admin
import { pool, q } from '../src/db.js'

const [email, role] = process.argv.slice(2)
const ROLES = ['student', 'manager', 'hr', 'admin']
try {
  if (!email || (role && !ROLES.includes(role))) {
    console.error(`usage: npm run user:role -- <email> [${ROLES.join('|')}]`)
    process.exitCode = 1
  } else {
    const [user] = await q('SELECT id, first_name, last_name, role FROM users WHERE email = ?', [email.trim().toLowerCase()])
    if (!user) {
      console.error(`No account with the email ${email}. Sign up in the app first.`)
      process.exitCode = 1
    } else if (!role) {
      console.log(`${user.first_name} ${user.last_name} <${email}> is ${user.role}`)
    } else {
      await q('UPDATE users SET role = ? WHERE id = ?', [role, user.id])
      console.log(`${user.first_name} ${user.last_name} <${email}>: ${user.role} → ${role}`)
    }
  }
} finally {
  await pool.end()
}
