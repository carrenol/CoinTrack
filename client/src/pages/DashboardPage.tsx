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
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [togglingFav, setTogglingFav] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'top' | 'favorites' | 'admin'>('top')

  // Cargar perfil y verificar estado activo
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!session?.access_token) {
          setLoadingProfile(false);
          return;
        }
        const res = await fetch('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })

        // Cuenta desactivada: cerrar sesión automáticamente
        if (res.status === 403) {
          const data = await res.json()
          if (data.code === 'ACCOUNT_DISABLED') {
            alert('Tu cuenta ha sido desactivada por un administrador. Serás redirigido al login.')
            await supabase.auth.signOut()
            return
          }
        }

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

  // Cargar favoritos del usuario
  useEffect(() => {
    if (!session?.access_token) return
    const fetchFavorites = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/favorites', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const ids = new Set<string>(data.favorites.map((f: any) => f.coin_id))
          setFavorites(ids)
        }
      } catch (e) {
        console.error('Error fetching favorites:', e)
      }
    }
    fetchFavorites()
  }, [session])

  const toggleFavorite = async (coinId: string) => {
    if (togglingFav) return
    setTogglingFav(coinId)
    const isFav = favorites.has(coinId)
    try {
      if (isFav) {
        const res = await fetch(`http://localhost:3001/api/favorites/${coinId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.ok) setFavorites(prev => { const s = new Set(prev); s.delete(coinId); return s })
      } else {
        const res = await fetch('http://localhost:3001/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ coin_id: coinId })
        })
        if (res.ok) setFavorites(prev => new Set(prev).add(coinId))
      }
    } catch (e) {
      console.error('Error toggling favorite:', e)
    } finally {
      setTogglingFav(null)
    }
  }

  const favoriteCoins = coins.filter(c => favorites.has(c.id))
  const isAdmin = userProfile?.role === 'admin'
  const handleLogout = async () => await supabase.auth.signOut()

  const CoinTable = ({ data }: { data: Coin[] }) => (
    data.length === 0 ? (
      <div className="bg-gray-900 rounded-3xl p-10 border border-gray-800 text-center text-gray-500">
        <p className="text-4xl mb-3">⭐</p>
        <p className="text-lg">No tienes favoritos aún.</p>
        <p className="text-sm mt-1">Haz clic en la estrella de cualquier cripto para agregarla.</p>
      </div>
    ) : (
      <div className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left p-6 w-8"></th>
              <th className="text-left p-6">#</th>
              <th className="text-left p-6">Moneda</th>
              <th className="text-right p-6">Precio</th>
              <th className="text-right p-6">24h</th>
              <th className="text-right p-6">Market Cap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((coin) => {
              const isFav = favorites.has(coin.id)
              return (
                <tr key={coin.id} className="hover:bg-gray-800/50 transition group">
                  <td className="p-6">
                    <button
                      onClick={() => toggleFavorite(coin.id)}
                      disabled={togglingFav === coin.id}
                      className={`text-xl transition-transform hover:scale-125 ${isFav ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'} ${togglingFav === coin.id ? 'opacity-50' : ''}`}
                      title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFav ? '★' : '☆'}
                    </button>
                  </td>
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
              )
            })}
          </tbody>
        </table>
      </div>
    )
  )

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
            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                activeTab === 'favorites'
                  ? 'bg-gray-800 text-yellow-400 font-medium'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-yellow-400'
              }`}
            >
              <span>⭐ Mis Favoritos</span>
              {favorites.size > 0 && (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {favorites.size}
                </span>
              )}
            </button>
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
              <p className="text-xs text-emerald-400">{isAdmin ? 'Administrador' : 'Usuario'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8">
          <h2 className="text-2xl font-semibold">
            {activeTab === 'top' && 'Top 10 Criptomonedas'}
            {activeTab === 'favorites' && 'Mis Favoritos'}
            {activeTab === 'admin' && '👑 Panel de Administración'}
          </h2>
          <button onClick={handleLogout} className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition">Cerrar Sesión</button>
        </header>

        <main className="p-8">
          {/* Sección: Admin Panel */}
          {activeTab === 'admin' && isAdmin && (
            <AdminPanel session={session} />
          )}

          {/* Sección: Mis Favoritos */}
          {activeTab === 'favorites' && (
            loadingCoins ? (
              <p className="text-gray-400">Cargando...</p>
            ) : (
              <CoinTable data={favoriteCoins} />
            )
          )}

          {/* Sección: Top 10 Criptomonedas */}
          {activeTab === 'top' && (
            loadingCoins ? (
              <p className="text-gray-400">Cargando criptomonedas...</p>
            ) : (
              <CoinTable data={coins} />
            )
          )}
        </main>
      </div>
    </div>
  )
}