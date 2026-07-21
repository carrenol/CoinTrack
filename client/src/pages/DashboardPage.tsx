import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import AdminPanel from '../components/AdminPanel';
import { useTheme } from '../context/ThemeContext';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface DashboardPageProps {
  session: Session
}

// Componente SVG para la gráfica Sparkline (Tendencia 7d)
const Sparkline = ({ prices, isPositive }: { prices?: number[]; isPositive: boolean }) => {
  if (!prices || prices.length === 0) return <span className="text-xs text-gray-400">N/A</span>;

  const width = 110;
  const height = 32;

  // Muestrear puntos para suavizar y optimizar el renderizado SVG
  const step = Math.max(1, Math.floor(prices.length / 25));
  const sampled = prices.filter((_, idx) => idx % step === 0);

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;

  const points = sampled
    .map((val, idx) => {
      const x = (idx / (sampled.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export default function DashboardPage({ session }: DashboardPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<any>(null)
  const [coins, setCoins] = useState<Coin[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [togglingFav, setTogglingFav] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'top' | 'favorites' | 'admin'>('top')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

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
  const fetchTopCoins = async () => {
    setLoadingCoins(true);
    try {
      const res = await fetch('http://localhost:3001/api/coins/top')
      if (res.ok) {
        const { data, timestamp } = await res.json()
        setCoins(data)
        const dateObj = timestamp ? new Date(timestamp) : new Date();
        setLastUpdated(dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + dateObj.toLocaleDateString('es-ES') + ')');
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
    } finally {
      setLoadingCoins(false)
    }
  }

  useEffect(() => {
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

  // --- CÁLCULO DE KPIS ---
  const totalMarketCap = coins.reduce((acc, c) => acc + (c.market_cap || 0), 0)
  const totalVolume24h = coins.reduce((acc, c) => acc + (c.total_volume || 0), 0)
  const topGainer = coins.length > 0 ? [...coins].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))[0] : null
  const greenCoinsCount = coins.filter(c => (c.price_change_percentage_24h || 0) >= 0).length

  const CoinTable = ({ data }: { data: Coin[] }) => (
    data.length === 0 ? (
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 border border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 shadow-sm dark:shadow-none">
        <p className="text-4xl mb-3">⭐</p>
        <p className="text-lg font-medium">No tienes favoritos aún.</p>
        <p className="text-sm mt-1 text-gray-400 dark:text-gray-500">Haz clic en la estrella de cualquier cripto para agregarla.</p>
      </div>
    ) : (
      <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none transition-colors duration-200">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
            <tr>
              <th className="text-left p-5 w-8"></th>
              <th className="text-left p-5">#</th>
              <th className="text-left p-5">Moneda</th>
              <th className="text-right p-5">Precio</th>
              <th className="text-right p-5">24h %</th>
              <th className="text-right p-5">Volumen (24h)</th>
              <th className="text-right p-5">Market Cap</th>
              <th className="text-center p-5">Tendencia (7d)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
            {data.map((coin) => {
              const isFav = favorites.has(coin.id)
              const isPositive = (coin.price_change_percentage_24h || 0) >= 0
              return (
                <tr key={coin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                  <td className="p-5">
                    <button
                      onClick={() => toggleFavorite(coin.id)}
                      disabled={togglingFav === coin.id}
                      className={`text-xl transition-transform hover:scale-125 ${isFav ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400'} ${togglingFav === coin.id ? 'opacity-50' : ''}`}
                      title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFav ? '★' : '☆'}
                    </button>
                  </td>
                  <td className="p-5 font-medium text-gray-900 dark:text-white">{coin.market_cap_rank}</td>
                  <td className="p-5 flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{coin.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase">{coin.symbol}</p>
                    </div>
                  </td>
                  <td className="p-5 text-right font-mono font-medium text-gray-900 dark:text-white">
                    ${coin.current_price.toLocaleString()}
                  </td>
                  <td className={`p-5 text-right font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                  </td>
                  <td className="p-5 text-right font-mono text-gray-600 dark:text-gray-300">
                    ${(coin.total_volume / 1e9).toFixed(2)}B
                  </td>
                  <td className="p-5 text-right font-mono text-gray-500 dark:text-gray-400">
                    ${(coin.market_cap / 1e9).toFixed(2)}B
                  </td>
                  <td className="p-5 text-center">
                    <Sparkline prices={coin.sparkline_in_7d?.price} isPositive={isPositive} />
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">CoinTrack</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Crypto Dashboard</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('top')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'top'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium shadow-sm dark:shadow-none'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Top Criptos
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                activeTab === 'favorites'
                  ? 'bg-yellow-50 dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 font-medium shadow-sm dark:shadow-none'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-yellow-600 dark:hover:text-yellow-400'
              }`}
            >
              <span>⭐ Mis Favoritos</span>
              {favorites.size > 0 && (
                <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {favorites.size}
                </span>
              )}
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === 'admin'
                    ? 'bg-emerald-50 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 font-medium shadow-sm dark:shadow-none'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                👑 Admin Panel
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            {userProfile?.avatar_url && <img src={userProfile.avatar_url} className="w-10 h-10 rounded-full" />}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{userProfile?.full_name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{isAdmin ? 'Administrador' : 'Usuario'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 transition-colors duration-200">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {activeTab === 'top' && 'Top 10 Criptomonedas'}
            {activeTab === 'favorites' && 'Mis Favoritos'}
            {activeTab === 'admin' && '👑 Panel de Administración'}
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition font-medium text-sm border border-gray-200 dark:border-gray-700 shadow-sm"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
            </button>
            <button onClick={handleLogout} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-medium">Cerrar Sesión</button>
          </div>
        </header>

        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Fila superior: KPIs y Hora de Actualización (solo en pestañas de criptos) */}
          {activeTab !== 'admin' && (
            <>
              {/* Barra de estado y actualización */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 px-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Última actualización: <strong>{lastUpdated || 'Cargando...'}</strong></span>
                </div>
                <button
                  onClick={fetchTopCoins}
                  disabled={loadingCoins}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-sm font-medium disabled:opacity-50"
                >
                  🔄 {loadingCoins ? 'Actualizando...' : 'Actualizar ahora'}
                </button>
              </div>

              {/* Tarjetas de KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cap. Mercado Top 10</p>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">${(totalMarketCap / 1e9).toFixed(2)} B</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Suma acumulada Top 10</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Volumen 24h Total</p>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">${(totalVolume24h / 1e9).toFixed(2)} B</p>
                  <p className="text-xs text-blue-500 mt-1">Operado en 24h</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mayor Alza 24h</p>
                  {topGainer ? (
                    <div>
                      <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white flex items-center justify-between">
                        <span>{topGainer.symbol.toUpperCase()}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-lg font-semibold">+{topGainer.price_change_percentage_24h.toFixed(2)}%</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{topGainer.name}</p>
                    </div>
                  ) : (
                    <p className="text-lg mt-2 text-gray-400">---</p>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tendencia del Mercado</p>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{greenCoinsCount} de {coins.length}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Criptomonedas en verde (24h)</p>
                </div>
              </div>
            </>
          )}

          {/* Sección: Admin Panel */}
          {activeTab === 'admin' && isAdmin && (
            <AdminPanel session={session} />
          )}

          {/* Sección: Mis Favoritos */}
          {activeTab === 'favorites' && (
            loadingCoins ? (
              <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            ) : (
              <CoinTable data={favoriteCoins} />
            )
          )}

          {/* Sección: Top 10 Criptomonedas */}
          {activeTab === 'top' && (
            loadingCoins ? (
              <p className="text-gray-500 dark:text-gray-400">Cargando criptomonedas...</p>
            ) : (
              <CoinTable data={coins} />
            )
          )}
        </main>
      </div>
    </div>
  )
}