import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback',
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-xl p-12 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/20">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white tracking-tight">MonaBit</h1>
          <p className="text-2xl text-white/70 mt-2">Crypto Dashboard</p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-4 px-6 rounded-2xl transition flex items-center justify-center gap-3 text-lg shadow-lg"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-6 h-6" 
          />
          Continuar con Google
        </button>

        <p className="text-white/50 text-sm mt-8">
          Solo para usuarios autorizados
        </p>
      </div>
    </div>
  )
}