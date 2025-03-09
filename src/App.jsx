import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import CharacterSheet from './components/CharacterSheet';
import DnDCharacterSheet from './components/DnDCharacterSheet';
import Auth from './components/Auth';
import CharacterList from './components/CharacterList';
import Layout from './components/Layout';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [useNewUI, setUseNewUI] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Constantes para la caché local
  const CACHE_KEY_CHARACTERS = 'dnd_cached_characters';
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

  // Variables de estado para el modo offline
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Funciones para manejar la caché local
  const saveToCache = (characters) => {
    try {
      const cacheData = {
        data: characters,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY_CHARACTERS, JSON.stringify(cacheData));
      console.log(`Guardados ${characters.length} personajes en caché local`);
    } catch (err) {
      console.error("Error al guardar en caché local:", err);
    }
  };

  const getFromCache = () => {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY_CHARACTERS);
      if (!cacheData) return null;

      const { data, timestamp } = JSON.parse(cacheData);
      const age = Date.now() - timestamp;

      // Verificar si la caché no ha expirado
      if (age > CACHE_TTL) {
        console.log("Caché local expirada");
        return null;
      }

      console.log(`Recuperados ${data.length} personajes de caché local (${Math.round(age / 1000 / 60)} minutos de antigüedad)`);
      return data;
    } catch (err) {
      console.error("Error al leer de caché local:", err);
      return null;
    }
  };

  // Aplicar la clase dnd-theme al body cuando useNewUI es verdadero
  useEffect(() => {
    if (useNewUI) {
      document.body.classList.add('dnd-theme');
    } else {
      document.body.classList.remove('dnd-theme');
    }
  }, [useNewUI]);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkSession = async () => {
      // Implementar un timeout para evitar quedarse en estado de carga indefinidamente
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout al verificar sesión - La operación tardó demasiado'));
        }, 8000); // 8 segundos máximo
      });
      
      try {
        console.log("Verificando sesión de usuario...");
        
        // Usar Promise.race para establecer un timeout
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
        
        const { data, error } = sessionResult;
        
        if (error) {
          console.error("Error al obtener la sesión:", error);
          setAuthError("Error al verificar la sesión: " + error.message);
          return;
        }
        
        if (data.session) {
          console.log("Sesión encontrada:", data.session.user.id);
          setSession(data.session);
          
          try {
            // Solo cargar personajes cuando estamos seguros de que hay una sesión
            await fetchCharacters();
          } catch (fetchError) {
            console.error("Error durante fetchCharacters en checkSession:", fetchError);
          }
        } else {
          console.log("No hay sesión activa");
          setSession(null);
          setCharacters([]);
        }
      } catch (e) {
        console.error("Error al verificar la sesión:", e);
        // Si es un timeout, mostrar un mensaje más claro
        if (e.message.includes('Timeout')) {
          setAuthError("La verificación de sesión está tardando demasiado. Por favor, intenta de nuevo.");
        } else {
          setAuthError("Error al verificar la sesión: " + e.message);
        }
      } finally {
        // Asegurarnos de que salimos del estado de carga incluso si hay errores
        console.log("Finalizando verificación de sesión");
        setLoading(false);
      }
    };
    
    checkSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Cambio en la autenticación:", event, session?.user?.id);
        
        setSession(session);
        
        if (session) {
          // Limpiar errores previos y modo offline cuando hay una sesión válida
          setAuthError(null);
          
          // Solo en eventos de autenticación positivos
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              // Reintentar cargar los datos del servidor
              await fetchCharacters();
            } catch (fetchError) {
              console.error("Error durante fetchCharacters en onAuthStateChange:", fetchError);
            }
          }
        } else {
          setCharacters([]);
          setIsOfflineMode(false); // Desactivar modo offline cuando no hay sesión
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Cargar personajes del usuario
  const fetchCharacters = async () => {
    let retryCount = 0;
    const maxRetries = 2;
    let usedCache = false;
    
    // Implementar un timeout general para evitar quedarse en estado de carga indefinidamente
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout al cargar personajes - La operación tardó demasiado'));
      }, 10000); // 10 segundos máximo para toda la operación
    });
    
    const loadCharacters = async () => {
      try {
        console.log(`Intento de carga de personajes #${retryCount + 1}`);
        
        // Verificar nuevamente la sesión actual por seguridad
        const { data: sessionData } = await supabase.auth.getSession();
        const currentSession = sessionData.session;
        
        // Verificar si hay un usuario autenticado
        if (!currentSession || !currentSession.user) {
          console.warn("fetchCharacters: No hay sesión de usuario activa para cargar personajes");
          setCharacters([]);
          return false;
        }
        
        console.log("Cargando personajes para usuario:", currentSession.user.id);
        
        // Crear una promesa con timeout para la operación específica de carga
        const fetchWithTimeout = Promise.race([
          supabase
            .from('characters')
            .select('id, name, character_data, created_at, updated_at')
            .eq('user_id', currentSession.user.id)
            .order('updated_at', { ascending: false }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout en la consulta a Supabase')), 5000)
          )
        ]);
        
        // Ejecutar la consulta con timeout
        const { data, error } = await fetchWithTimeout;
        
        if (error) {
          console.error('Error al cargar personajes:', error);
          if (error.code === 'PGRST301' || error.code?.includes('auth')) {
            console.error('Posible error de autenticación o permisos.');
          }
          
          if (retryCount < maxRetries) {
            console.log(`Reintentando carga de personajes (${retryCount + 1}/${maxRetries})...`);
            return false; // Indica que debemos reintentar
          } else {
            // Intentar usar la caché como último recurso
            const cachedCharacters = getFromCache();
            if (cachedCharacters && cachedCharacters.length > 0) {
              console.log("Utilizando datos en caché debido a error de conexión");
              setCharacters(cachedCharacters);
              usedCache = true;
              return true; // Éxito al usar caché
            }
            alert(`Error al cargar personajes: ${error.message}`);
            return true; // Indica que debemos parar los reintentos
          }
        }
        
        console.log("Personajes cargados exitosamente:", data?.length || 0, data);
        // Guardar en caché para uso futuro
        if (data && data.length > 0) {
          saveToCache(data);
        }
        setCharacters(data || []);
        return true; // Éxito, no necesitamos más reintentos
      } catch (error) {
        console.error('Error completo al cargar personajes:', error);
        
        if (retryCount < maxRetries) {
          console.log(`Reintentando carga de personajes (${retryCount + 1}/${maxRetries}) después de error...`);
          return false; // Indica que debemos reintentar
        } else {
          // Intentar usar la caché como último recurso
          const cachedCharacters = getFromCache();
          if (cachedCharacters && cachedCharacters.length > 0) {
            console.log("Utilizando datos en caché debido a error inesperado");
            setCharacters(cachedCharacters);
            usedCache = true;
            return true; // Éxito al usar caché
          }
          
          setCharacters([]);
          console.error('Error después de máximos reintentos:', error);
          return true; // Indica que debemos parar los reintentos
        }
      }
    };
    
    try {
      setLoading(true);
      
      // Ejecutar la carga con un timeout general
      await Promise.race([
        (async () => {
          // Función para intentar cargar personajes con reintento
          while (retryCount <= maxRetries) {
            const success = await loadCharacters();
            if (success) {
              break;
            }
            retryCount++;
            
            if (retryCount <= maxRetries) {
              // Esperar un poco antes de reintentar (backoff exponencial)
              const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
              console.log(`Esperando ${delay}ms antes del siguiente intento...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        })(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error("Error global o timeout en fetchCharacters:", error);
      
      // En caso de timeout o error global, intentar usar la caché
      const cachedCharacters = getFromCache();
      if (cachedCharacters && cachedCharacters.length > 0) {
        console.log("Utilizando datos en caché debido a timeout global");
        setCharacters(cachedCharacters);
        usedCache = true;
        setIsOfflineMode(true); // Establecer modo offline
      } else {
        // Si no hay caché, mostrar lista vacía
        setCharacters([]);
      }
    } finally {
      setLoading(false);
      
      // Si usamos la caché, mostrar un mensaje al usuario
      if (usedCache) {
        setIsOfflineMode(true); // Establecer modo offline
        setAuthError("Conectado en modo offline. Usando datos guardados localmente.");
      }
    }
  };

  // Crear un nuevo personaje
  const createNewCharacter = async () => {
    try {
      setLoading(true);
      
      // Verificar nuevamente la sesión actual por seguridad
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;
      
      // Asegurarse de que tenemos el ID del usuario actual
      if (!currentSession || !currentSession.user) {
        console.warn("createNewCharacter: No hay sesión de usuario activa");
        alert("No hay sesión de usuario activa. Por favor, inicia sesión nuevamente.");
        return;
      }

      const userId = currentSession.user.id;
      console.log("Creando personaje para usuario:", userId);
      
      const defaultName = `Personaje ${characters.length + 1}`;
      
      const { data, error } = await supabase
        .from('characters')
        .insert([{
          name: defaultName,
          user_id: userId, // Añadiendo el ID del usuario actual
          character_data: {
            // Datos iniciales del personaje
            attributes: {
              strength: 10,
              dexterity: 10,
              constitution: 10,
              intelligence: 10,
              wisdom: 10,
              charisma: 10
            },
            characterInfo: {
              name: defaultName,
              class: '',
              level: 1,
              race: '',
              background: '',
              alignment: '',
              hp: 10,
              maxHp: 10,
              ac: 10,
              speed: 30,
              initiative: 0
            },
            weapons: [],
            items: []
          }
        }])
        .select();
      
      if (error) {
        console.error('Error detallado al crear personaje:', error);
        alert(`Error al crear el personaje: ${error.message}`);
        return;
      }
      
      console.log("Personaje creado exitosamente:", data);
      
      // Refrescar la lista de personajes
      await fetchCharacters();
      
      // Seleccionar el personaje recién creado si existe
      if (data && data.length > 0) {
        setSelectedCharacter(data[0]);
      } else {
        console.warn("No se pudo obtener el ID del personaje creado");
      }
    } catch (error) {
      console.error('Error completo al crear personaje:', error);
      alert(`Error al crear el personaje: ${error.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un personaje
  const deleteCharacter = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este personaje?')) {
      try {
        setLoading(true);
        
        // Verificar nuevamente la sesión actual por seguridad
        const { data: sessionData } = await supabase.auth.getSession();
        const currentSession = sessionData.session;
        
        // Verificar si hay un usuario autenticado
        if (!currentSession || !currentSession.user) {
          console.warn("deleteCharacter: No hay sesión de usuario activa");
          alert("No hay sesión de usuario activa. Por favor, inicia sesión nuevamente.");
          return;
        }
        
        console.log(`Eliminando personaje con ID: ${id} para usuario: ${currentSession.user.id}`);
        
        const { error } = await supabase
          .from('characters')
          .delete()
          .eq('id', id)
          .eq('user_id', currentSession.user.id); // Asegurar que solo elimina personajes del usuario actual
        
        if (error) {
          console.error('Error al eliminar personaje:', error);
          alert(`Error al eliminar el personaje: ${error.message}`);
          return;
        }
        
        console.log("Personaje eliminado correctamente");
        await fetchCharacters(); // Recargar la lista
        
        if (selectedCharacter && selectedCharacter.id === id) {
          setSelectedCharacter(null);
        }
      } catch (error) {
        console.error('Error completo al eliminar personaje:', error);
        alert(`Error al eliminar el personaje: ${error.message || 'Desconocido'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Cerrar sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Guardar los cambios en un personaje
  const handleSaveCharacter = async (characterData) => {
    try {
      setLoading(true);
      
      // Verificar nuevamente la sesión actual por seguridad
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;
      
      // Verificar si hay un usuario autenticado
      if (!currentSession || !currentSession.user) {
        console.warn("handleSaveCharacter: No hay sesión de usuario activa");
        alert("No hay sesión de usuario activa. Por favor, inicia sesión nuevamente.");
        return;
      }
      
      console.log(`Guardando personaje con ID: ${characterData.id} para usuario: ${currentSession.user.id}`);
      
      // Determinar el nombre según esté en characterInfo o info para mantener compatibilidad
      const characterName = characterData.characterInfo?.name || characterData.info?.name || "Personaje sin nombre";
      
      // Verificar que el personaje pertenece al usuario actual
      const { data: characterCheck, error: checkError } = await supabase
        .from('characters')
        .select('user_id')
        .eq('id', characterData.id)
        .single();
        
      if (checkError) {
        console.error('Error al verificar propiedad del personaje:', checkError);
        alert(`Error al guardar: ${checkError.message}`);
        return;
      }
      
      if (characterCheck && characterCheck.user_id !== currentSession.user.id) {
        console.error('Intento de guardar un personaje que no pertenece al usuario actual');
        alert(`Error: No tienes permiso para modificar este personaje.`);
        return;
      }
      
      const { error } = await supabase
        .from('characters')
        .update({ 
          name: characterName,
          character_data: characterData
        })
        .eq('id', characterData.id)
        .eq('user_id', currentSession.user.id); // Asegurar que solo actualiza personajes del usuario actual
      
      if (error) {
        console.error('Error al guardar personaje:', error);
        alert(`Error al guardar el personaje: ${error.message}`);
        return;
      }
      
      console.log("Personaje guardado exitosamente");
      alert('Personaje guardado correctamente');
      await fetchCharacters(); // Recargar la lista
    } catch (error) {
      console.error('Error completo al guardar personaje:', error);
      alert(`Error al guardar el personaje: ${error.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para alternar entre la UI antigua y la nueva
  const toggleUI = () => {
    console.log("Alternando UI de", useNewUI, "a", !useNewUI);
    // Usamos el callback para garantizar que estemos trabajando con el valor más reciente
    setUseNewUI(prev => {
      const newValue = !prev;
      console.log("Nuevo valor:", newValue);
      return newValue;
    });
  };

  // Timeout de seguridad para asegurar que nunca nos quedamos en estado de carga indefinidamente
  useEffect(() => {
    // Solo aplicar si estamos en estado de carga
    if (loading) {
      console.log("Iniciando timeout de seguridad para estado de carga");
      const safetyTimeout = setTimeout(() => {
        console.warn("⚠️ Timeout de seguridad activado: forzando salida del estado de carga");
        setLoading(false);
        setAuthError("La aplicación tardó demasiado en cargar. Por favor, intenta de nuevo.");
      }, 15000); // 15 segundos como máximo absoluto
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [loading]);

  // Función para sincronizar manualmente los datos
  const syncData = async () => {
    try {
      setIsSyncing(true);
      await fetchCharacters();
      setIsOfflineMode(false);
    } catch (err) {
      console.error("Error al sincronizar datos:", err);
      setAuthError("Error al sincronizar. Verifica tu conexión a internet.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Página principal con gestión de estados
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md w-80">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Cargando...</p>
          <p className="text-sm text-gray-500 mt-2">Conectando con la base de datos</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión, mostrar pantalla de autenticación
  if (!session) {
    return (
      <>
        <Auth />
        {authError && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md z-50">
            <p>{authError}</p>
            <button 
              onClick={() => setAuthError(null)}
              className="absolute top-1 right-1 text-red-500 hover:text-red-700"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {authError && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          <p>{authError}</p>
          <button 
            onClick={() => setAuthError(null)}
            className="absolute top-1 right-1 text-red-500 hover:text-red-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
      
      {isOfflineMode && (
        <div className="fixed bottom-4 left-0 right-0 mx-auto w-auto max-w-md z-50 bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg shadow-md flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.414 1.414 5 5 0 010-7.07 1 1 0 011.414 0zm4.242 0a1 1 0 011.414 0 5 5 0 010 7.072 1 1 0 01-1.414-1.414 3 3 0 000-4.242 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            <span>Modo sin conexión</span>
          </div>
          <button 
            onClick={syncData}
            disabled={isSyncing}
            className="ml-4 px-3 py-1 bg-amber-700 text-white rounded hover:bg-amber-800 transition-colors disabled:opacity-50"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      )}
      
      <Layout 
        onBack={() => setSelectedCharacter(null)} 
        showBackButton={!!selectedCharacter}
        useNewUI={useNewUI}
      >
        {selectedCharacter ? (
          <>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm mb-4">
              <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${useNewUI ? 'dnd-heading' : ''}`}>
                  {selectedCharacter.name || 'Personaje sin nombre'}
                </h2>
                <button 
                  onClick={toggleUI}
                  className={`px-4 py-2 rounded transition-colors ${
                    useNewUI 
                      ? 'bg-gray-600 text-white hover:bg-gray-700' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {useNewUI ? 'UI Clásica' : 'UI Mejorada D&D'}
                </button>
              </div>
            </div>
            
            {useNewUI ? (
              <DnDCharacterSheet 
                characterId={selectedCharacter.id}
                initialData={{
                  attributes: selectedCharacter.character_data?.attributes || {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10
                  },
                  characterInfo: selectedCharacter.character_data?.characterInfo || {
                    name: selectedCharacter.name || '',
                    class: '',
                    level: 1,
                    race: '',
                    background: '',
                    alignment: '',
                    hp: 10,
                    maxHp: 10,
                    ac: 10,
                    speed: 30,
                    initiative: 0
                  },
                  weapons: selectedCharacter.character_data?.weapons || [],
                  items: selectedCharacter.character_data?.items || []
                }}
                onCharacterSaved={handleSaveCharacter}
                onDelete={deleteCharacter}
              />
            ) : (
              <CharacterSheet 
                characterId={selectedCharacter} 
                onCharacterSaved={handleSaveCharacter} 
              />
            )}
          </>
        ) : (
          <div className="mx-auto p-4">
            <div className="bg-gray-800 text-white dark:bg-gray-900 p-4 rounded-lg shadow-md mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className={`text-2xl font-bold text-white ${useNewUI ? 'dnd-heading' : ''}`}>
                  Tus Personajes de D&D
                </h1>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={toggleUI}
                    className={`px-4 py-2 rounded transition-colors ${
                      useNewUI 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {useNewUI ? 'UI Clásica' : 'UI Mejorada D&D'}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
            
            {characters.length === 0 ? (
              // Cuando no hay personajes, mostrar un botón grande y destacado
              <div className="flex flex-col items-center justify-center py-8">
                <button 
                  onClick={createNewCharacter}
                  className={`
                    px-8 py-4 rounded-lg text-xl font-bold mb-6
                    ${useNewUI 
                      ? 'dnd-button'
                      : 'bg-green-500 text-white hover:bg-green-600 shadow-xl'
                    }
                  `}
                >
                  + Crear Nuevo Personaje
                </button>
                <div className={`bg-white shadow-md rounded-lg p-6 w-full ${useNewUI ? 'dnd-card dnd-border' : ''}`}>
                  <CharacterList 
                    characters={characters} 
                    onSelect={setSelectedCharacter} 
                    onDelete={deleteCharacter} 
                    useNewUI={useNewUI}
                  />
                </div>
              </div>
            ) : (
              // Cuando hay personajes, mostrar el diseño normal
              <div>
                <div className="mb-6 flex justify-center">
                  <button 
                    onClick={createNewCharacter}
                    className={`
                      px-6 py-3 rounded-lg text-xl font-bold 
                      ${useNewUI 
                        ? 'dnd-button'
                        : 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                      }
                    `}
                  >
                    + Crear Nuevo Personaje
                  </button>
                </div>
                
                <div className={`bg-white shadow-md rounded-lg p-6 ${useNewUI ? 'dnd-card dnd-border' : ''}`}>
                  <CharacterList 
                    characters={characters} 
                    onSelect={setSelectedCharacter} 
                    onDelete={deleteCharacter} 
                    useNewUI={useNewUI}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Layout>
    </>
  );
}

export default App;
