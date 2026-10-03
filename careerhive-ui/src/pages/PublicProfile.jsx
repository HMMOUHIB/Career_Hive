import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { SkillChip, SkillIcon } from '../components/SkillChip'
import { FollowButton, ProfilePosts } from '../components/Social'
import { Avatar, CardHead, Icon, Page, rise } from '../components/ui'
import { colorFor, fmtDate, roleLabel, useDerived, useStore } from '../store/store'
import { Empty } from './Dashboard'

/** Anyone's profile, as colleagues see it: who they are, skills, certificates, follow counts and posts. */
export default function PublicProfile() {
  const { id } = useParams()
  const uid = Number(id)
  const { actions } = useStore()
  const { contacts } = useDerived()
  const [p, setP] = useState(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    let live = true
    setP(null); setMissing(false)
    api.profile(uid).then((r) => live && setP(r.profile)).catch(() => live && setMissing(true))
    return () => { live = false }
  }, [uid])

  if (missing) return <Page><div className="card"><Empty icon="UserX" title="Person not found" text="This account may have been removed." /></div></Page>
  if (!p) return <Page><div className="card pp-hero pp-loading" /></Page>

  const contact = contacts.find((c) => Number(c.userId ?? c.id) === uid)
  const followChanged = (following) => setP((x) => ({ ...x, isFollowing: following, followers: x.followers + (following ? 1 : -1) }))

  return (
    <Page>
      <motion.section variants={rise} className="card pp-hero">
        <div className="pp-cover" style={p.cover ? { backgroundImage: `url(${p.cover})` } : undefined} />
        <div className="pp-main">
          <Avatar name={p.name} src={p.avatar} color={colorFor(p.name)} size={112} />
          <div className="pp-id">
            <h1>{p.name}</h1>
            <p>{[p.position, p.department].filter(Boolean).join(' · ') || roleLabel[p.role]}</p>
            <div className="pp-meta">
              <span className="chip accent">{roleLabel[p.role]}</span>
              {p.location && <span><Icon name="MapPin" size={13} />{p.location}</span>}
              {p.joinedAt && <span><Icon name="CalendarDays" size={13} />Joined {fmtDate(p.joinedAt)}</span>}
              {p.followsYou && !p.isMe && <span className="chip">Follows you</span>}
            </div>
          </div>
          <div className="pp-actions">
            {p.isMe ? (
              <Link to="/profile" className="btn ghost"><Icon name="PenLine" size={15} />Edit profile</Link>
            ) : (
              <>
                <FollowButton userId={uid} following={p.isFollowing} onChange={followChanged} />
                {contact && <button type="button" className="btn ghost" onClick={() => actions.openChat(contact.id)}><Icon name="MessageCircle" size={15} />Message</button>}
              </>
            )}
          </div>
        </div>
        <div className="pp-stats">
          <div><b>{p.posts}</b><small>Posts</small></div>
          <div><b>{p.followers}</b><small>Followers</small></div>
          <div><b>{p.following}</b><small>Following</small></div>
        </div>
      </motion.section>

      <div className="pp-grid">
        <motion.div variants={rise} className="pp-side">
          <div className="card">
            <CardHead icon="User" title="About" />
            <p className="pp-bio">{p.bio || 'No bio yet.'}</p>
            {p.education && <div className="pp-line"><Icon name="GraduationCap" size={15} />{p.education}</div>}
          </div>
          <div className="card">
            <CardHead icon="Sparkles" tone="violet" title="Skills" sub={`${p.skills.length} listed`} />
            <div className="tags">{p.skills.length ? p.skills.map((s) => <SkillChip key={s} name={s} />) : <span className="pp-none">No skills listed yet.</span>}</div>
          </div>
          <div className="card">
            <CardHead icon="Award" tone="warn" title="Certificates" sub={`${p.certificates.length} earned`} />
            {p.certificates.map((c) => (
              <div key={c.name} className="pp-cert"><span className="pp-cert-ic"><SkillIcon name={c.name} size={16} fallback="BadgeCheck" /></span><span>{c.name}</span>{c.issuedDate && <small>{fmtDate(c.issuedDate)}</small>}</div>
            ))}
            {!p.certificates.length && <span className="pp-none">No certificates yet.</span>}
          </div>
        </motion.div>

        <motion.div variants={rise}>
          <div className="h-row" style={{ marginTop: 0 }}><h2>Posts</h2></div>
          <ProfilePosts userId={uid} mine={p.isMe} />
        </motion.div>
      </div>
    </Page>
  )
}
