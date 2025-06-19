import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import '@fortawesome/fontawesome-free/css/all.min.css' 
import './index.css'
import AppRoutes from './routes'
import { AuthProvider } from './contexts/AuthContext'
import { loadModels } from './utils/face'

// Load face-api.js models on startup
loadModels().catch(err => {
  console.error('Error loading face-api models:', err)
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)