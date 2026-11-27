import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import UserProvider from './context/UserProvider'
import CalendarEventsProvider from './context/CalendarEventsProvider'

// A deployment can replace hashed chunks while an old tab is still open.
// Vite reports that case as a preload error; refresh once to load the new
// index.html and its matching asset names instead of showing a blank route.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()

  const retryKey = 'vite-preload-retry'
  if (sessionStorage.getItem(retryKey) === 'true') return

  sessionStorage.setItem(retryKey, 'true')
  window.location.reload()
})

// Allow a later, unrelated deployment error to retry after the app has had
// time to load successfully.
window.setTimeout(() => sessionStorage.removeItem('vite-preload-retry'), 30_000)

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <CalendarEventsProvider>
      <App />
    </CalendarEventsProvider>
  </UserProvider>
);
