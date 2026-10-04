import Logo, { BrandTitle } from './Logo'

/** The loading screen: the emblem turning like a coin over the title. App fades it out onto the workspace. */
export default function Splash({ theme, onReady }) {
  return (
    <div className="splash" role="status" aria-label="Loading CareerHive">
      <span className="splash-light" aria-hidden="true" />
      <Logo theme={theme} spin className="splash-mark" onReady={onReady} />
      <BrandTitle />
      <span className="splash-bar" aria-hidden="true"><i /></span>
      <span className="splash-note">Waking up the server — after a quiet spell this takes up to a minute.</span>
    </div>
  )
}
