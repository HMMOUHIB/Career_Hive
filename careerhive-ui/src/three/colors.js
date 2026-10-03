export const orbColors = (theme) => (theme === 'frost' ? { a: '#7fd6ff', b: '#2f5bff' } : { a: '#ff5a4e', b: '#7b2cff' })

/** The radar logo's screen per theme (three/RadarLogo.jsx): dark glass in the theme hue, grid and glow from its accents. */
export const radarColors = (theme) => ({
  frost: { bg: '#071d45', grid: 'rgba(143,208,255,.5)', glow: '#5fb2ff', core: '#eaf6ff' },
  ember: { bg: '#2a0a0e', grid: 'rgba(255,160,140,.42)', glow: '#ff8a6b', core: '#fff2ea' },
  light: { bg: '#3d0c10', grid: 'rgba(255,170,160,.45)', glow: '#f0664e', core: '#fff4f0' },
})[theme] ?? radarColors('frost')
