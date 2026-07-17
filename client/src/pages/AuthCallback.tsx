import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        navigate('/login')
      } else {
        navigate('/dashboard', { replace: true }) // replace: true evita volver atrás
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-6"></div>
        <p className="text-xl">Procesando tu sesión...</p>
        <p className="text-sm text-gray-500 mt-2">Por favor espera</p>
      </div>
    </div>
  )
}