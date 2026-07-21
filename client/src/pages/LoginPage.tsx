import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback',
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-emerald-100 dark:from-indigo-950 dark:via-purple-950 dark:to-blue-950 flex flex-col items-center justify-center relative transition-colors duration-300">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl transition font-medium text-sm backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-md"
      >
        {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
      </button>

      <div className="bg-white/70 dark:bg-white/10 backdrop-blur-xl p-12 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-200 dark:border-white/20 transition-colors duration-300">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white tracking-tight">CoinTrack</h1>
          <p className="text-2xl text-gray-600 dark:text-white/70 mt-2">Crypto Dashboard</p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-semibold py-4 px-6 rounded-2xl transition flex items-center justify-center gap-3 text-lg shadow-lg"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-6 h-6" 
          />
          Continuar con Google
        </button>

        <p className="text-gray-500 dark:text-white/50 text-sm mt-8">
          A demo project for Monabit
        </p>
      </div>
    </div>
  )
}