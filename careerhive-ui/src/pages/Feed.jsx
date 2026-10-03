import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Composer, FollowButton, PersonRow, PostList, usePosts } from '../components/Social'
import { Avatar, CardHead, Icon, IconTile, Page, Reveal, rise } from '../components/ui'
import { colorFor, fullName, roleLabel, useStore } from '../store/store'

/** The feed: your posts and those of the people you follow, with people to follow on the side. */
export default function Feed() {
  const { state } = useStore()
  const me = state.user
  const load = useCallback((before) => api.feed(before), [])
  const feed = usePosts(load)
  const [net, setNet] = useState(null)
  const loadNet = useCallback(() => api.network().then(setNet).catch(() => setNet({ following: [], followers: [], suggestions: [] })), [])
  useEffect(() => { loadNet() }, [loadNet])

  // someone you follow posted since this list was loaded: offer to show it
  const [since, setSince] = useState(() => Date.now())
  const fresh = (state.serverNotifs ?? []).filter((n) => n.type === 'social' && n.title.endsWith('shared a post') && n.at > since).length
  const showFresh = () => { setSince(Date.now()); feed.reload() }
  const followed = () => { loadNet(); feed.reload() }

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div><div className="eyebrow">Connect · Feed</div><Reveal text="Feed" /><p>Posts from you and the people you follow.</p></div>
      </motion.div>

      <div className="feed-grid">
        <motion.div variants={rise} className="post-stack">
          <Composer onPosted={feed.add} />
          {fresh > 0 && <button type="button" className="new-posts" onClick={showFresh}><Icon name="ArrowUp" size={15} />{fresh} new post{fresh === 1 ? '' : 's'}</button>}
          <PostList feed={feed} empty={(
            <div className="card empty-card">
              <IconTile icon="Rss" size={46} />
              <div><b>Your feed is quiet</b><p>Follow colleagues to see their posts here, or share the first one.</p></div>
            </div>
          )} />
        </motion.div>

        <motion.aside variants={rise} className="feed-side">
          <div className="card me-card">
            <div className="me-cover" />
            <Link to={`/u/${me.id}`} className="me-id">
              <Avatar name={fullName(me)} src={me.profilePhoto} color={colorFor(fullName(me))} size={64} />
              <b>{fullName(me)}</b>
              <small>{me.position || roleLabel[me.role]}</small>
            </Link>
            <div className="me-stats">
              <div><b>{net?.following.length ?? '—'}</b><small>Following</small></div>
              <div><b>{net?.followers.length ?? '—'}</b><small>Followers</small></div>
            </div>
            <Link to={`/u/${me.id}`} className="btn ghost sm" style={{ width: '100%' }}>View my profile <Icon name="ArrowRight" size={14} /></Link>
          </div>

          <div className="card">
            <CardHead icon="UserPlus" tone="accent2" title="People to follow" sub="Colleagues you may know" />
            {net?.suggestions.map((p) => (
              <PersonRow key={p.id} person={p} sub={p.teammate ? 'Your teammate' : p.followsYou ? 'Follows you' : undefined}>
                <FollowButton userId={p.id} following={false} onChange={followed} small />
              </PersonRow>
            ))}
            {net && !net.suggestions.length && <div className="mini-empty"><IconTile icon="CheckCheck" tone="good" size={34} soft /><div><b>You follow everyone</b><small>New colleagues will show up here.</small></div></div>}
          </div>
        </motion.aside>
      </div>
    </Page>
  )
}
