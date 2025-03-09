import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  
  // Verificar si hay problemas de sesión al cargar
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log("Auth: Verificando sesión existente...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth: Error al verificar sesión existente:", error);
          setMessage("Error al verificar sesión: " + error.message);
        } else if (data?.session) {
          console.log("Auth: Hay una sesión existente, pero no está activa en la app");
        }
      } catch (err) {
        console.error("Auth: Error inesperado al verificar sesión:", err);
      }
    };
    
    checkExistingSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setMessage('');
      setLoading(true)
      console.log("Auth: Intentando iniciar sesión con email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("Auth: Error de inicio de sesión:", error);
        throw error;
      }
      
      console.log("Auth: Inicio de sesión exitoso:", data?.user?.id);
    } catch (error) {
      console.error("Auth: Error completo de inicio de sesión:", error);
      setMessage(error.error_description || error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      setMessage('');
      setLoading(true)
      console.log("Auth: Intentando registrar nuevo usuario con email:", email);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("Auth: Error de registro:", error);
        throw error;
      }
      
      if (data?.user?.identities?.length === 0) {
        setMessage('Este email ya está registrado. Por favor, inicia sesión.');
      } else {
        setMessage('Revisa tu email para confirmar tu cuenta');
        console.log("Auth: Registro exitoso, verificación enviada");
      }
    } catch (error) {
      console.error("Auth: Error completo de registro:", error);
      setMessage(error.error_description || error.message || "Error al registrarse");
    } finally {
      setLoading(false)
    }
  }

  // Función para probar la conexión a Supabase
  const testConnection = async () => {
    setMessage("Probando conexión a Supabase...");
    setLoading(true);
    
    try {
      // Intentar una operación básica de Supabase
      const startTime = Date.now();
      const { data, error } = await supabase.from('characters').select('count').limit(1);
      const endTime = Date.now();
      
      if (error) {
        if (error.code === 'PGRST301') {
          // Este error es normal si no hay permisos, pero indica que Supabase responde
          setMessage(`✅ Conexión establecida en ${endTime - startTime}ms. Error de permisos normal.`);
        } else {
          setMessage(`❌ Error de conexión: ${error.message}`);
        }
      } else {
        setMessage(`✅ Conexión establecida en ${endTime - startTime}ms. Base de datos responde correctamente.`);
      }
    } catch (err) {
      setMessage(`❌ Error inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

          {/* Botón para probar la conexión */}
          <div className="mt-6">
            <button
              onClick={testConnection}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Probando..." : "Probar conexión a Supabase"}
            </button>
          </div>
          
          {/* Mensaje de error o éxito */}
          {message && (
            <div className={`mt-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 