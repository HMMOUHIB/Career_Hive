import { motion } from 'framer-motion'
import Logo, { BrandTitle } from './Logo'

/** The loading screen: the Hamzaoui emblem turning like a coin over the animated title; fades out onto the app. */
export default function Splash({ theme, onReady }) {
  return (
    <motion.div className="splash" role="status" aria-label="Loading CareerHive" exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
      <span className="splash-glow" />
      <Logo theme={theme} spin className="splash-mark" onReady={onReady} />
      <BrandTitle />
      <span className="splash-bar"><i /></span>
    </motion.div>
  )
}
