import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface DashboardPageProps {
  session: Session
}

export default function DashboardPage({ session }: DashboardPageProps) {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserProfile(data.user)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-3xl font-bold tracking-tight text-emerald-400">MonaBit</h1>
          <p className="text-sm text-gray-500">Crypto Dashboard</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800 text-white">
              📊 Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition">
              ⭐ Favoritos
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition">
              📈 Mercados
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition">
              ⚙️ Configuración
            </a>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-2xl">
            {userProfile?.avatar_url && (
              <img 
                src={userProfile.avatar_url} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full" 
              />
            )}
            <div>
              <p className="font-medium">{userProfile?.full_name || session.user.email}</p>
              <p className="text-xs text-emerald-400">
                {userProfile?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-red-600/80 hover:bg-red-600 rounded-xl text-sm font-medium transition"
          >
            Cerrar Sesión
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800">
              <h3 className="text-3xl font-bold mb-2">¡Bienvenido de vuelta!</h3>
              <p className="text-gray-400 text-lg">
                Aquí podrás ver el mercado de criptomonedas en tiempo real.
              </p>
            </div>

            {/* Placeholder para futuro dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                <p className="text-gray-500">Total Market Cap</p>
                <p className="text-4xl font-bold mt-2 text-emerald-400">—</p>
              </div>
              <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                <p className="text-gray-500">Bitcoin Dominance</p>
                <p className="text-4xl font-bold mt-2">—</p>
              </div>
              <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                <p className="text-gray-500">24h Change</p>
                <p className="text-4xl font-bold mt-2 text-emerald-400">—</p>
              </div>
            </div>

            <div className="mt-8 text-center text-gray-500">
              <p>Próximamente: Gráficos con CoinGecko</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}