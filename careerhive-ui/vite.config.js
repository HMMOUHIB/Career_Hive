import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:single` bundles everything into one HTML file (handy for demos).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  server: {
    // Point this at your backend during dev: requests to /api go to it.
    proxy: {
      '/api': { target: process.env.VITE_BACKEND ?? 'http://localhost:8000', changeOrigin: true },
    },
  },
}))
