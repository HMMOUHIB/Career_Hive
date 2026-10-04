export const orbColors = (theme) => (theme === 'light' ? { a: '#ff7a5c', b: '#d8402b' } : { a: '#ff5b45', b: '#ffa66b' })

/** The radar logo's screen per theme (three/RadarLogo.jsx): dark glass in the theme hue, grid and glow from its accents. */
export const radarColors = (theme) => ({
  dark: { bg: '#1f0a09', grid: 'rgba(255,160,140,.42)', glow: '#ff7a63', core: '#fff2ea' },
  light: { bg: '#3d0c10', grid: 'rgba(255,170,160,.45)', glow: '#e0703f', core: '#fff4f0' },
})[theme] ?? radarColors('dark')
