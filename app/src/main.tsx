import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BackendAuthProvider } from './lib/backendAuth'
import { AppBackendProvider } from './lib/backendData'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BackendAuthProvider>
      <AppBackendProvider>
        <App />
      </AppBackendProvider>
    </BackendAuthProvider>
  </StrictMode>,
)
