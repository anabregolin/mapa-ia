import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { aoAbrir } from './lib/backup'
import { iniciarNuvem } from './lib/nuvem'
import { iniciarHifenizacao } from './lib/hifenizar'

aoAbrir()
iniciarNuvem()
iniciarHifenizacao()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
