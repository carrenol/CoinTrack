import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'   // ← Cambiado a "type"

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
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

  const handleLoginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback',
      }
    })

    if (error) console.error('Error login:', error)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserProfile(null)
  }

  const fetchProfile = async () => {
    if (!session?.access_token) return

    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
      } else {
        console.error('Error fetching profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  useEffect(() => {
    if (session) {
      fetchProfile()
    }
  }, [session])

  if (loading) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px' }}>
      <h1>🚀 MonaBit Crypto Dashboard</h1>

      {!session ? (
        <div>
          <button 
            onClick={handleLoginWithGoogle}
            style={{
              padding: '14px 28px',
              fontSize: '18px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            🔑 Iniciar sesión con Google
          </button>
        </div>
      ) : (
        <div>
          <h2>Bienvenido, {userProfile?.full_name || session.user?.email}</h2>
          
          {userProfile?.avatar_url && (
            <img 
              src={userProfile.avatar_url} 
              alt="Avatar" 
              style={{ width: '80px', borderRadius: '50%', margin: '10px 0' }} 
            />
          )}

          <p><strong>Rol:</strong> {userProfile?.role || 'user'}</p>

          <button 
            onClick={handleLogout}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              marginTop: '15px'
            }}
          >
            Cerrar Sesión
          </button>

          <hr style={{ margin: '30px 0' }} />
          <details>
            <summary>Información de Debug</summary>
            <pre style={{ background: '#f4f4f4', padding: '15px', borderRadius: '6px', overflow: 'auto' }}>
              {JSON.stringify(userProfile || session, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}

export default App