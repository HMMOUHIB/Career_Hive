# CareerHive API

The backend for `../careerhive-ui`: **Node.js (20.12+) + Express 5 + MySQL 8 / MariaDB 10.4+**.
It implements every route the UI calls (`careerhive-ui/src/api/client.js`) with the same payloads as the UI's demo mode.

## Run it locally (XAMPP)

1. Open the **XAMPP Control Panel** and start **MySQL**.
2. Set up the API:
   ```bash
   cd careerhive-backend
   npm install
   cp .env.example .env      # then edit: JWT_SECRET, STAFF_EMAILS (your email), SMTP_* (to send real emails)
   npm run db:setup          # creates the "careerhive" database and its tables (0 users)
   npm run dev               # http://localhost:8000
   ```
3. In `careerhive-ui`, put `VITE_API_URL=http://localhost:8000` in `.env.local` and restart `npm run dev`.
4. Open the app and **sign up**. The database starts empty, so the first account is yours.
5. Open the **confirmation email**, and click the link. It confirms your address and signs you in.
   Until SMTP is set up, the email is printed in the API's terminal instead: click the link there.

**Who is a manager.** Every new account starts as an **employee**, whether it signs up with a password or with LinkedIn,
GitHub or Google. Emails in `STAFF_EMAILS` are the workspace **owner(s)**: they become managers automatically, and they get a
**People & roles** page in the app. There they choose who else is a manager or HR. The change applies immediately and the
person is notified. Only the owner can change roles, and the owner's own role is set by `STAFF_EMAILS`.
From the command line:

```bash
npm run user:role -- someone@example.com            # show the role
npm run user:role -- someone@example.com hr         # student (employee) | manager | hr | admin
```

A promotion goes through **HR first, then the manager**. To try the whole flow alone, sign up a second account of yours
and make it HR with the command above, plus an employee account.

## Sign-in, email confirmation and social sign-in

- **Sign up** creates the account and emails a confirmation link, valid for 24 hours. Sign-in is refused until the email is
  confirmed. The sign-in screen then offers **Resend the link**. Opening the link confirms the address and signs you in.
- **Forgot password** emails a reset link, valid for 1 hour. Every link works once; asking for a new one cancels the previous one.
  The database only stores a SHA-256 of each link's token.
- **LinkedIn, GitHub and Google** sign-in: the provider confirms the email, so no confirmation link is needed. Signing
  in with the same email as an existing account signs into that account.
- Sessions are JWTs (7 days by default, `JWT_EXPIRES_IN`), sent as `Authorization: Bearer …`. Passwords are hashed with bcrypt.

**Send real emails (Gmail).** Turn on 2-Step Verification on the Google account. Create an App password at
<https://myaccount.google.com/apppasswords>, then set in `.env`:
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=you@gmail.com`, `SMTP_PASS=<the 16-letter app password>`.
Any other SMTP service works the same way (Brevo, Mailgun, SendGrid, Outlook…).

**Connect LinkedIn and GitHub.** Each needs an app on the provider's side. Put its keys in `.env`, then restart the API:

| Provider | Where | Callback / redirect URL to register | `.env` |
|---|---|---|---|
| LinkedIn | <https://www.linkedin.com/developers/apps> → *Create app* → *Products*: add **Sign In with LinkedIn using OpenID Connect** → *Auth* tab | `http://localhost:8000/api/auth/linkedin/callback` | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| GitHub | GitHub → *Settings* → *Developer settings* → *OAuth Apps* → *New OAuth App* (homepage `http://localhost:5173`) | `http://localhost:8000/api/auth/github/callback` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (*Generate a new client secret*) |
| Google | <https://console.cloud.google.com> → *APIs & Services* → *Credentials* → *OAuth client ID* (Web) | `http://localhost:8000/api/auth/google/callback` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

In production, replace `http://localhost:8000` with your `API_URL`. Until a provider's keys are set, its button returns
to the sign-in page with "This sign-in option is not set up on the server yet".

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | API with auto-restart on file changes |
| `npm start` | API (production) |
| `npm run db:setup` | Create the database and tables if missing. Safe to re-run; never deletes data |
| `npm run db:reset` | **Drop** the database and recreate it empty (refuses in production without `--yes`) |
| `npm run db:demo` | Load the demo people, formations, teams and requests into an **empty** database (every password: `demo1234`) |
| `npm run user:role -- <email> [role]` | Show or change an account's role |
| `npm test` | 35 end-to-end tests against a throw-away `careerhive_test` database |

## Configuration

Everything is in `.env` (see `.env.example` for the full list with comments):

- `JWT_SECRET` — required in production.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` — the database. XAMPP uses `root` with no password.
- `FRONTEND_URL`, `CORS_ORIGINS` — where the UI runs. It's allowed by CORS, and social sign-in returns there.
- `API_URL` — this API's public URL, used for OAuth callbacks.
- `SIGNUP_ROLES`, `STAFF_EMAILS` — who may create which accounts (see above).
- `REQUIRE_EMAIL_VERIFICATION`, `SMTP_*`, `MAIL_FROM` — email confirmation and the mail server (see above).
- `UPLOAD_DIR`, `MAX_UPLOAD_MB` — where course files are stored, and the size limit.
- `GOOGLE_*`, `LINKEDIN_*`, `GITHUB_*` — optional social sign-in. Register `{API_URL}/api/auth/<provider>/callback` with each provider.

## Database

`sql/schema.sql` is plain SQL. It's idempotent, so you can re-run it, or import it in phpMyAdmin after selecting the database.
`sql/seed.sql` is the optional demo data. Table and column names follow the original `careerhive_db`.

| Table | Holds |
|---|---|
| `users` | accounts: role (`student` = employee, `manager`, `hr`, `admin`), `email_verified_at`, profile, photos, salary, rating, social login, `last_seen_at` (presence) |
| `auth_tokens` | single-use email links (confirm email, reset password): a SHA-256 of the token, expiry, used time |
| `skills`, `certificates` | a profile's skills and certificates |
| `formations`, `formation_skills` | the training catalog |
| `user_formation_progress` | enrollments with progress and status (`En cours` / `Terminée`) |
| `formation_requests` | enrollment requests: `pending` → HR → `on-hold` → manager → `approved` (enrolls) or `rejected` |
| `formation_resources`, `resource_completions` | course content (videos, files, links). Progress = finished items ÷ all items |
| `promotion_requests` (+ `_skills`, `_certificates`) | promotion requests: `pending` → HR review → `on-hold` → manager final approval → `approved` (updates the profile) or `rejected` |
| `teams`, `team_members`, `team_member_skills` | teams. A member is linked to an account or added by name only |
| `chat_messages` | two-way team chat between accounts |
| `notifications` | the bell feed: messages, review decisions, assignments, the review queue, social activity |
| `posts`, `post_likes`, `post_comments`, `follows` | the social feed: posts (text and an optional image under `UPLOAD_DIR/posts`), likes, comments, who follows whom |
| `cv_analyses` | the CV coach: one saved analysis per person (file name and the result as JSON); the CV file itself is never stored |

All `DATETIME`s are stored in UTC.

## API

Every route except `/api/auth/*` and `/api/health` needs `Authorization: Bearer <token>`. Errors are returned as `{ "message": "…" }`.
*Staff* = manager, hr or admin.

| Route | Who | Notes |
|---|---|---|
| `POST /api/auth/signup` | anyone | → `{ verificationRequired, email, emailSent }` and emails a confirmation link. Rate-limited. Passwords are 8+ characters, bcrypt-hashed |
| `POST /api/auth/login` | anyone | → `{ token, user }`; `403 { code: "EMAIL_NOT_VERIFIED" }` until the email is confirmed |
| `GET /api/auth/verify-email?token=` | the emailed link | confirms the email, then redirects to the UI signed in |
| `POST /api/auth/resend-verification`, `POST /api/auth/forgot-password` | anyone | `{ email }`; same answer whether or not the account exists |
| `POST /api/auth/reset-password` | the emailed link | `{ token, password }` → `{ token, user }` |
| `GET /api/auth/me` | signed in | |
| `GET /api/auth/{google,linkedin,github}` | anyone | OAuth; returns to `FRONTEND_URL/oauth-success?token=…` |
| `GET /api/dashboard` | signed in | `me` panel; staff also get `org` (totals, pipelines, trends, review queue) |
| `PUT /api/users/:id` | owner, admin | partial update: only the fields you send change |
| `GET /api/employees` | staff | directory for assigning, teams and reviews |
| `GET /api/people`, `PUT /api/people/:id/role`, `DELETE /api/people/:id` | owner (`STAFF_EMAILS`) | every account with its role and sign-in method; set `student` \| `manager` \| `hr`; delete an account (not the owner's) |
| `GET/POST/DELETE /api/skills…`, `/api/certificates…` | read: signed in · write: owner | |
| `GET /api/teams` | signed in | staff: all teams. Employees: their own team, with other members' ratings hidden |
| `POST /api/teams`, `POST /api/teams/:id/members`, `PUT /api/teams/members/:id/feedback` | staff | |
| `GET/POST /api/chat-messages`, `PUT /api/chat-messages/:contactId/read` | signed in | employees can message their own team |
| `GET/POST /api/promotion-requests` | signed in | staff see all requests; employees see their own |
| `PUT /api/promotion-requests/:id/hr-review` · `/manager-final-approve` · `/reject` | hr · manager · whoever holds the stage | nobody can review their own request |
| `GET/POST /api/formations`, `POST /api/formations/:id/assign`, `DELETE /api/formations/:id` | read: signed in · write: staff | HR and managers run the catalog; they can't join formations. Assign targets employees only. Delete removes enrollments, requests, content and files, and tells enrolled employees |
| `GET /api/my-formations`, `PUT /api/my-formations/:id/progress` | signed in | |
| `GET/POST /api/formation-requests`, `PUT …/:id/hr-review` · `/manager-confirm` · `/reject` | as for promotions | |
| `GET /api/formations/:fid/resources` | signed in | file URLs only for staff and enrolled learners |
| `POST /api/formations/:fid/resources` (multipart `files`), `…/resources/link`, `PATCH`/`DELETE /api/formation-resources/:rid` | staff | |
| `POST /api/formation-resources/:rid/complete` | enrolled | → `{ progress }` |
| `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all` | signed in | |
| `GET /api/feed`, `GET /api/profiles/:id`, `GET /api/profiles/:id/posts`, `GET /api/network` | signed in | your posts and those of people you follow (`?before=<post id>` pages back, 20 at a time); lists are `{ posts, people, more }` |
| `POST/DELETE /api/profiles/:id/follow` | signed in | follow / unfollow (the followed person is notified) |
| `POST /api/posts` `{ body?, image? }`, `DELETE /api/posts/:id` | signed in · delete: author or staff | `image` is a JPEG/PNG/WebP/GIF data: URL, at most 6 MB, checked and saved as a file; followers are notified |
| `POST/DELETE /api/posts/:id/like`, `GET/POST /api/posts/:id/comments`, `DELETE /api/comments/:id` | signed in · delete: comment author, post author or staff | the post's author is notified |
| `POST /api/cv/analyze` (multipart `cv`), `GET /api/cv/analysis`, `DELETE /api/cv/analysis` | signed in | CV coach: a PDF, Word (.docx) or text CV up to 8 MB is read in memory and never stored. Returns skills, experience, seniority, career track, skills to learn, the best formations and the best manager, each with reasons; one analysis is kept per person |
| `GET /api/health` | anyone | database check |

## Security notes

- The role is read from the database on every request, so a role change takes effect immediately.
- Salaries and promotion files are only visible to staff and to their owner. Team ratings and feedback are only visible to staff and the member themself.
- Uploads get random file names and are served from `/uploads`. HTML, SVG and script files are refused.
- CORS only allows the configured frontend origins.

## Limits worth knowing

- **Chat:** conversations are keyed by account (`sender_id`, `recipient_id`). Employees can message managers, HR and their teammates; staff can message everyone; both sides can reply.
- **Chat extras:** message reactions, replies, pins and chat themes still live in the browser, as before.
- **Live push:** notifications are pushed over Server-Sent Events (`/api/notifications/stream`); the UI also polls every 20 seconds as a fallback.
- **Uploads on hosting:** uploads are stored on local disk. On hosts with an ephemeral disk (Render, Railway), mount a volume at `UPLOAD_DIR`.

## Deploy (Railway / Render)

1. Create a MySQL database. Set the `DB_*` variables (`DB_SSL=true` if the provider needs it), plus `NODE_ENV=production`, `JWT_SECRET`, `API_URL`, `FRONTEND_URL` and `STAFF_EMAILS`.
2. Run `npm run db:setup` once. The start command is `npm start`.
3. In the UI's hosting (e.g. Vercel), set `VITE_API_URL` to the API's URL.
