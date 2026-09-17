import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import UserProvider from './context/UserProvider'
import CalendarEventsProvider from './context/CalendarEventsProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <CalendarEventsProvider>
        <App />
      </CalendarEventsProvider>
    </UserProvider>
  </StrictMode>,
)
