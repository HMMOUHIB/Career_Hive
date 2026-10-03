// Social: everyone signed in can post (text and an optional image), like, comment and follow people.
//   GET  /feed                      posts by you and the people you follow, newest first (?before=<post id> pages back)
//   GET  /profiles/:id              someone's public profile: identity, skills, certificates, follow counts
//   GET  /profiles/:id/posts        their posts
//   POST /profiles/:id/follow       follow · DELETE unfollows
//   GET  /network                   who you follow, who follows you, and people you may know
//   POST /posts                     { body?, image? (data: URL) } · DELETE /posts/:id (author or staff)
//   POST /posts/:id/like            like · DELETE unlikes
//   GET|POST /posts/:id/comments    { body } · DELETE /comments/:id (comment author, post author or staff)
// Lists come back as { posts, people }: posts carry authorId and `people` holds each author once (avatars are large).
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { config } from '../config.js'
import { one, q } from '../db.js'
import { fail, id, isStaff, iso, text } from '../http.js'
import { fullName } from '../mappers.js'
import { notify } from '../notify.js'

const router = Router()
const PAGE = 20
const MAX_IMAGE = 6 * 1024 * 1024
const DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/
// the bytes must really be the image type claimed (they are served from our origin)
const MAGIC = { jpeg: (b) => b[0] === 0xff && b[1] === 0xd8, png: (b) => b.subarray(1, 4).toString() === 'PNG', gif: (b) => b.subarray(0, 3).toString() === 'GIF', webp: (b) => b.subarray(8, 12).toString() === 'WEBP' }

/** Store a data: URL image under UPLOAD_DIR/posts with an unguessable name; returns the path relative to UPLOAD_DIR. */
async function saveImage(dataUrl) {
  const m = typeof dataUrl === 'string' && dataUrl.match(DATA_URL)
  if (!m) fail(400, 'The image must be a JPEG, PNG, WebP or GIF.')
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length > MAX_IMAGE) fail(400, 'The image must be at most 6 MB.')
  if (!MAGIC[m[1]](bytes)) fail(400, 'That file is not a valid image.')
  const dir = path.join(config.uploadDir, 'posts')
  await fs.promises.mkdir(dir, { recursive: true })
  const name = `${crypto.randomBytes(16).toString('hex')}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`
  await fs.promises.writeFile(path.join(dir, name), bytes)
  return `posts/${name}`
}

/** Delete a post image file (paths are relative to UPLOAD_DIR and never leave it). */
export function removePostImage(rel) {
  if (!rel) return
  const file = path.resolve(config.uploadDir, rel)
  if (file.startsWith(config.uploadDir + path.sep)) fs.promises.unlink(file).catch(() => {})
}

const PERSON = 'u.id, u.first_name, u.last_name, u.profile_photo, u.position, u.department, u.role'
const personOut = (u) => ({ id: u.id, name: fullName(u), avatar: u.profile_photo, position: u.position, department: u.department, role: u.role })

/** Posts matching `where` (with its args), newest first, one page before `before`; plus each author once. */
async function postPage(me, where, args, before) {
  const cursor = before ? 'AND p.id < ?' : ''
  const rows = await q(`SELECT p.id, p.user_id, p.body, p.image_path, p.created_at,
      (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likes,
      (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) AS comments,
      EXISTS (SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
    FROM posts p WHERE ${where} ${cursor} ORDER BY p.id DESC LIMIT ?`, [me.id, ...args, ...(before ? [before] : []), PAGE + 1])
  const page = rows.slice(0, PAGE)
  const ids = [...new Set(page.map((p) => p.user_id))]
  const people = ids.length ? await q(`SELECT ${PERSON} FROM users u WHERE u.id IN (?)`, [ids]) : []
  return {
    posts: page.map((p) => postOut(p, me)),
    people: Object.fromEntries(people.map((u) => [u.id, personOut(u)])),
    more: rows.length > PAGE,
  }
}
const postOut = (p, me) => ({
  id: p.id, authorId: p.user_id, body: p.body ?? '', image: p.image_path ? `/uploads/${p.image_path}` : null, createdAt: iso(p.created_at),
  likes: Number(p.likes ?? 0), comments: Number(p.comments ?? 0), liked: !!p.liked, canDelete: p.user_id === me.id || isStaff(me),
})
const excerpt = (s) => (s ? (s.length > 90 ? `${s.slice(0, 87)}…` : s) : 'a photo')
const cursor = (req) => (req.query.before ? id(req.query.before, 'cursor') : null)
const loadPost = async (req) => {
  const post = await one('SELECT id, user_id, body, image_path FROM posts WHERE id = ?', [id(req.params.id, 'post id')])
  if (!post) fail(404, 'Post not found.')
  return post
}

router.get('/feed', async (req, res) => {
  res.json(await postPage(req.user, '(p.user_id = ? OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?))', [req.user.id, req.user.id], cursor(req)))
})

router.get('/profiles/:id', async (req, res) => {
  const u = await one(`SELECT ${PERSON}, u.bio, u.location, u.education, u.cover_photo, u.created_at FROM users u WHERE u.id = ?`, [id(req.params.id, 'user id')])
  if (!u) fail(404, 'Person not found.')
  const [skills, certificates, [counts]] = await Promise.all([
    q('SELECT skill_name AS name FROM skills WHERE user_id = ? ORDER BY id', [u.id]),
    q('SELECT certificate_name AS name, issued_date FROM certificates WHERE user_id = ? ORDER BY id', [u.id]),
    q(`SELECT (SELECT COUNT(*) FROM follows WHERE followee_id = ?) AS followers, (SELECT COUNT(*) FROM follows WHERE follower_id = ?) AS following,
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS posts,
        EXISTS (SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?) AS is_following,
        EXISTS (SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?) AS follows_you`,
    [u.id, u.id, u.id, req.user.id, u.id, u.id, req.user.id]),
  ])
  res.json({
    profile: {
      ...personOut(u), bio: u.bio, location: u.location, education: u.education, cover: u.cover_photo, joinedAt: iso(u.created_at),
      skills: skills.map((s) => s.name), certificates: certificates.map((c) => ({ name: c.name, issuedDate: c.issued_date })),
      followers: Number(counts.followers), following: Number(counts.following), posts: Number(counts.posts),
      isFollowing: !!counts.is_following, followsYou: !!counts.follows_you, isMe: u.id === req.user.id,
    },
  })
})

router.get('/profiles/:id/posts', async (req, res) => {
  res.json(await postPage(req.user, 'p.user_id = ?', [id(req.params.id, 'user id')], cursor(req)))
})

router.post('/profiles/:id/follow', async (req, res) => {
  const who = await one('SELECT id FROM users WHERE id = ?', [id(req.params.id, 'user id')])
  if (!who) fail(404, 'Person not found.')
  if (who.id === req.user.id) fail(400, 'You can’t follow yourself.')
  const { affectedRows } = await q('INSERT IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)', [req.user.id, who.id])
  if (affectedRows) await notify(who.id, { type: 'social', title: `${req.user.name} started following you`, body: 'Follow back to see their posts in your feed.', link: `/u/${req.user.id}` })
  res.json({ following: true })
})

router.delete('/profiles/:id/follow', async (req, res) => {
  await q('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?', [req.user.id, id(req.params.id, 'user id')])
  res.json({ following: false })
})

router.get('/network', async (req, res) => {
  const me = req.user.id
  const [following, followers, suggestions] = await Promise.all([
    q(`SELECT ${PERSON} FROM follows f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = ? ORDER BY f.created_at DESC`, [me]),
    q(`SELECT ${PERSON} FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.followee_id = ? ORDER BY f.created_at DESC`, [me]),
    // people you don't follow yet: teammates first, then people who follow you, then your department, then the rest
    q(`SELECT ${PERSON},
        EXISTS (SELECT 1 FROM team_members a JOIN team_members b ON b.team_id = a.team_id WHERE a.user_id = ? AND b.user_id = u.id) AS teammate,
        EXISTS (SELECT 1 FROM follows x WHERE x.follower_id = u.id AND x.followee_id = ?) AS follows_you
      FROM users u WHERE u.id <> ? AND u.id NOT IN (SELECT followee_id FROM follows WHERE follower_id = ?)
      ORDER BY teammate DESC, follows_you DESC, (u.department <=> (SELECT department FROM users WHERE id = ?)) DESC, u.id DESC LIMIT 6`, [me, me, me, me, me]),
  ])
  res.json({
    following: following.map(personOut), followers: followers.map(personOut),
    suggestions: suggestions.map((u) => ({ ...personOut(u), teammate: !!u.teammate, followsYou: !!u.follows_you })),
  })
})

router.post('/posts', async (req, res) => {
  const body = text(req.body.body, { field: 'Post', max: 3000 })
  if (!body && !req.body.image) fail(400, 'Write something or add an image.')
  const image = req.body.image ? await saveImage(req.body.image) : null
  const { insertId } = await q('INSERT INTO posts (user_id, body, image_path) VALUES (?, ?, ?)', [req.user.id, body, image])
  const followers = await q('SELECT follower_id FROM follows WHERE followee_id = ?', [req.user.id])
  await notify(followers.map((f) => f.follower_id), { type: 'social', title: `${req.user.name} shared a post`, body: excerpt(body), link: '/feed' })
  res.status(201).json(await postPage(req.user, 'p.id = ?', [insertId], null))
})

router.delete('/posts/:id', async (req, res) => {
  const post = await loadPost(req)
  if (post.user_id !== req.user.id && !isStaff(req.user)) fail(403, 'You can only delete your own posts.')
  await q('DELETE FROM posts WHERE id = ?', [post.id])
  removePostImage(post.image_path)
  res.json({ deleted: true })
})

const likeCount = async (postId) => Number((await one('SELECT COUNT(*) AS n FROM post_likes WHERE post_id = ?', [postId])).n)

router.post('/posts/:id/like', async (req, res) => {
  const post = await loadPost(req)
  const { affectedRows } = await q('INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)', [post.id, req.user.id])
  if (affectedRows && post.user_id !== req.user.id) {
    await notify(post.user_id, { type: 'social', title: `${req.user.name} liked your post`, body: excerpt(post.body), link: `/u/${post.user_id}` })
  }
  res.json({ liked: true, likes: await likeCount(post.id) })
})

router.delete('/posts/:id/like', async (req, res) => {
  const post = await loadPost(req)
  await q('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id])
  res.json({ liked: false, likes: await likeCount(post.id) })
})

const commentOut = (c, me, postAuthorId) => ({
  id: c.comment_id, body: c.comment_body, createdAt: iso(c.commented_at), author: personOut(c),
  canDelete: c.id === me.id || postAuthorId === me.id || isStaff(me),
})
// the comment's own columns are aliased: PERSON brings the author's id
const COMMENT_SELECT = `SELECT c.id AS comment_id, c.body AS comment_body, c.created_at AS commented_at, ${PERSON} FROM post_comments c JOIN users u ON u.id = c.user_id`

router.get('/posts/:id/comments', async (req, res) => {
  const post = await loadPost(req)
  const rows = await q(`${COMMENT_SELECT} WHERE c.post_id = ? ORDER BY c.id`, [post.id])
  res.json({ comments: rows.map((c) => commentOut(c, req.user, post.user_id)) })
})

router.post('/posts/:id/comments', async (req, res) => {
  const post = await loadPost(req)
  const body = text(req.body.body, { field: 'Comment', max: 1500, required: true })
  const { insertId } = await q('INSERT INTO post_comments (post_id, user_id, body) VALUES (?, ?, ?)', [post.id, req.user.id, body])
  if (post.user_id !== req.user.id) {
    await notify(post.user_id, { type: 'social', title: `${req.user.name} commented on your post`, body: excerpt(body), link: `/u/${post.user_id}` })
  }
  res.status(201).json({ comment: commentOut(await one(`${COMMENT_SELECT} WHERE c.id = ?`, [insertId]), req.user, post.user_id) })
})

router.delete('/comments/:id', async (req, res) => {
  const c = await one('SELECT c.id, c.user_id, p.user_id AS post_author FROM post_comments c JOIN posts p ON p.id = c.post_id WHERE c.id = ?', [id(req.params.id, 'comment id')])
  if (!c) fail(404, 'Comment not found.')
  if (c.user_id !== req.user.id && c.post_author !== req.user.id && !isStaff(req.user)) fail(403, 'You can’t delete this comment.')
  await q('DELETE FROM post_comments WHERE id = ?', [c.id])
  res.json({ deleted: true })
})

export default router
