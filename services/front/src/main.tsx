import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import './i18n'


/*SPA fonction*/
const currentScript = document.currentScript as HTMLScriptElement | null
const mountIdFromScript = currentScript?.dataset?.mountId
const mountId = mountIdFromScript || 'root'

function ensureMountElement(id: string) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('div')
    el.id = id
    if (document.body) {
      document.body.appendChild(el)
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(el!)
      })
    }
  }
  return el
}

function mountApp() {
  const mountEl = ensureMountElement(mountId)!
  if (!mountEl) return
  createRoot(mountEl).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp)
} else {
  mountApp()
}
