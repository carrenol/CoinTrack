import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { ThemeProvider } from './context/ThemeContext'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AuthCallback from './pages/AuthCallback'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
        <p className="text-xl font-medium">Cargando...</p>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route 
            path="/login" 
            element={!session ? <LoginPage /> : <Navigate to="/dashboard" />} 
          />

          {/* Rutas protegidas */}
          <Route 
            path="/dashboard" 
            element={session ? <DashboardPage session={session} /> : <Navigate to="/login" />} 
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App