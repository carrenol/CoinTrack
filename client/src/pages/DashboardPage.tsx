import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import AdminPanel from '../components/AdminPanel';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

interface DashboardPageProps {
  session: Session
}

export default function DashboardPage({ session }: DashboardPageProps) {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [coins, setCoins] = useState<Coin[]>([])
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [activeTab, setActiveTab] = useState<'top' | 'admin'>('top')

  // Cargar perfil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!session?.access_token) {
          console.warn("No access token available");
          setLoadingProfile(false);
          return;
        }
        const res = await fetch('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUserProfile(data.profile)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [session])

  // Cargar Top 10 de CoinGecko
  useEffect(() => {
    const fetchTopCoins = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/coins/top')
        if (res.ok) {
          const { data } = await res.json()
          setCoins(data)
        }
      } catch (error) {
        console.error('Error fetching coins:', error)
      } finally {
        setLoadingCoins(false)
      }
    }

    fetchTopCoins()
  }, [])

  const isAdmin = userProfile?.role === 'admin'
  const handleLogout = async () => await supabase.auth.signOut()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-3xl font-bold text-emerald-400">CoinTrack</h1>
          <p className="text-sm text-gray-500">Crypto Dashboard</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('top')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'top'
                  ? 'bg-gray-800 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
              }`}
            >
              📊 Top Criptos
            </button>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800/60 hover:text-white transition cursor-not-allowed opacity-50">
              ⭐ Mis Favoritos
            </div>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === 'admin'
                    ? 'bg-gray-800 text-emerald-400 font-medium'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-emerald-400'
                }`}
              >
                👑 Admin Panel
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-2xl">
            {userProfile?.avatar_url && <img src={userProfile.avatar_url} className="w-10 h-10 rounded-full" />}
            <div>
              <p className="font-medium">{userProfile?.full_name}</p>
              <p className="text-xs text-emerald-400">{isAdmin ? 'Administrador' : 'Usuario123'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
          <h2 className="text-2xl font-semibold">
            {activeTab === 'top' ? 'Top 10 Criptomonedas' : '👑 Panel de Administración'}
          </h2>
          <button onClick={handleLogout} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition">Cerrar Sesión</button>
        </header>

        <main className="p-8">
          {/* Sección: Admin Panel */}
          {activeTab === 'admin' && isAdmin && (
            <AdminPanel session={session} />
          )}

          {/* Sección: Top 10 Criptomonedas */}
          {activeTab === 'top' && (
            loadingCoins ? (
              <p>Cargando criptomonedas...</p>
            ) : (
              <div className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-left p-6">#</th>
                      <th className="text-left p-6">Moneda</th>
                      <th className="text-right p-6">Precio</th>
                      <th className="text-right p-6">24h</th>
                      <th className="text-right p-6">Market Cap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {coins.map((coin) => (
                      <tr key={coin.id} className="hover:bg-gray-800/50 transition">
                        <td className="p-6 font-medium">{coin.market_cap_rank}</td>
                        <td className="p-6 flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                          <div>
                            <p className="font-semibold">{coin.name}</p>
                            <p className="text-gray-500 text-sm uppercase">{coin.symbol}</p>
                          </div>
                        </td>
                        <td className="p-6 text-right font-mono">
                          ${coin.current_price.toLocaleString()}
                        </td>
                        <td className={`p-6 text-right font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {coin.price_change_percentage_24h?.toFixed(2)}%
                        </td>
                        <td className="p-6 text-right font-mono text-gray-400">
                          ${(coin.market_cap / 1e9).toFixed(2)}B
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  )
}