import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import UserProvider from './context/UserProvider'
import CalendarEventsProvider from './context/CalendarEventsProvider'

const preloadErrorReloadKey = `vite-preload-error-reloaded:${import.meta.url.split('?')[0]}`

window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem(preloadErrorReloadKey)) return

  event.preventDefault()
  sessionStorage.setItem(preloadErrorReloadKey, 'true')
  window.location.reload()
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <CalendarEventsProvider>
        <App />
      </CalendarEventsProvider>
    </UserProvider>
  </StrictMode>
);