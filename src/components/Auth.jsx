import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      setMessage(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setMessage('Revisa tu email para confirmar tu cuenta')
    } catch (error) {
      setMessage(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-amber-100">D&D Character Sheets</h1>
        <p className="mt-2 text-center text-sm text-amber-300 italic">¡La aventura te espera, valiente héroe!</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-amber-50 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-2 border-amber-800">
          <div className="mb-6 border-b border-amber-800">
            <div className="-mb-px flex">
              <button
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  isLogin 
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-amber-900 hover:text-amber-700 hover:border-amber-300'
                }`}
                onClick={() => setIsLogin(true)}
              >
                Iniciar Sesión
              </button>
              <button
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  !isLogin 
                    ? 'border-red-800 text-red-800'
                    : 'border-transparent text-amber-900 hover:text-amber-700 hover:border-amber-300'
                }`}
                onClick={() => setIsLogin(false)}
              >
                Registrarse
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={isLogin ? handleLogin : handleSignUp}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-amber-900">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-amber-600 rounded-md shadow-sm placeholder-amber-400 focus:outline-none focus:ring-red-800 focus:border-red-800 sm:text-sm bg-amber-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-amber-900">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-amber-600 rounded-md shadow-sm placeholder-amber-400 focus:outline-none focus:ring-red-800 focus:border-red-800 sm:text-sm bg-amber-50"
                />
              </div>
            </div>

            {message && (
              <div className="p-3 rounded-md bg-amber-100 border border-amber-600">
                <p className="text-sm text-amber-900">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : isLogin ? 'Entrar al Reino' : 'Crear Personaje'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-amber-50 text-amber-900">
                  {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                </span>
              </div>
            </div>

            <div className="mt-2 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-red-800 hover:text-red-900"
              >
                {isLogin ? 'Regístrate ahora' : 'Inicia sesión'}
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-amber-900">
            Aplicación no oficial de hojas de personaje para D&D
          </div>
        </div>
      </div>
    </div>
  );
} 