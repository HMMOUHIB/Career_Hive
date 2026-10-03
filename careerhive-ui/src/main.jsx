import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { StoreProvider } from './store/store'

// Single-file demo builds use hash URLs; the real app uses clean URLs (needed for /oauth-success).
const Router = import.meta.env.MODE === 'single' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <App />
      </StoreProvider>
    </Router>
  </StrictMode>,
)
