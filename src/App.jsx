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
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchCharacters();
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session) {
          fetchCharacters();
        } else {
          setCharacters([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Cargar personajes del usuario
  const fetchCharacters = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!session || !session.user) {
        console.warn("No hay sesión de usuario activa para cargar personajes");
        setCharacters([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, created_at, updated_at')
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error al cargar personajes:', error);
        alert(`Error al cargar personajes: ${error.message}`);
        throw error;
      }
      
      setCharacters(data || []);
    } catch (error) {
      console.error('Error completo al cargar personajes:', error);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  // Crear un nuevo personaje
  const createNewCharacter = async () => {
    try {
      // Asegurarse de que tenemos el ID del usuario actual
      if (!session || !session.user) {
        throw new Error("No hay sesión de usuario activa. Por favor, inicia sesión nuevamente.");
      }

      const userId = session.user.id;
      
      const { data, error } = await supabase
        .from('characters')
        .insert([{
          name: `Personaje ${characters.length + 1}`,
          user_id: userId, // Añadiendo el ID del usuario actual
          character_data: {
            // Datos iniciales del personaje (vacíos)
            attributes: {
              strength: 10,
              dexterity: 10,
              constitution: 10,
              intelligence: 10,
              wisdom: 10,
              charisma: 10
            },
            characterInfo: {
              name: `Personaje ${characters.length + 1}`,
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
            }
          }
        }])
        .select();
      
      if (error) {
        console.error('Error detallado:', error);
        alert(`Error al crear el personaje: ${error.message}`);
        throw error;
      }
      
      if (data && data[0]) {
        await fetchCharacters(); // Recargar la lista
        setSelectedCharacter(data[0].id);
      }
    } catch (error) {
      console.error('Error completo al crear personaje:', error);
      alert(`Error al crear el personaje: ${error.message || 'Desconocido'}`);
    }
  };

  // Eliminar un personaje
  const deleteCharacter = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este personaje?')) {
      try {
        // Verificar si hay un usuario autenticado
        if (!session || !session.user) {
          throw new Error("No hay sesión de usuario activa. Por favor, inicia sesión nuevamente.");
        }
        
        const { error } = await supabase
          .from('characters')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error al eliminar personaje:', error);
          alert(`Error al eliminar el personaje: ${error.message}`);
          throw error;
        }
        
        await fetchCharacters(); // Recargar la lista
        if (selectedCharacter === id) {
          setSelectedCharacter(null);
        }
      } catch (error) {
        console.error('Error completo al eliminar personaje:', error);
        alert(`Error al eliminar el personaje: ${error.message || 'Desconocido'}`);
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
      // Verificar si hay un usuario autenticado
      if (!session || !session.user) {
        throw new Error("No hay sesión de usuario activa. Por favor, inicia sesión nuevamente.");
      }
      
      const { error } = await supabase
        .from('characters')
        .update({ 
          name: characterData.info.name,
          character_data: characterData
        })
        .eq('id', characterData.id);
      
      if (error) {
        console.error('Error al guardar personaje:', error);
        alert(`Error al guardar el personaje: ${error.message}`);
        throw error;
      }
      
      alert('Personaje guardado correctamente');
      await fetchCharacters(); // Recargar la lista
    } catch (error) {
      console.error('Error completo al guardar personaje:', error);
      alert(`Error al guardar el personaje: ${error.message || 'Desconocido'}`);
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

  // Renderizar la aplicación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
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
              characterId={selectedCharacter}
              initialData={{
                attributes: selectedCharacter.character_data?.attributes || {
                  strength: 10,
                  dexterity: 10,
                  constitution: 10,
                  intelligence: 10,
                  wisdom: 10,
                  charisma: 10
                },
                info: {
                  name: selectedCharacter.name || '',
                  class: selectedCharacter.character_data?.characterInfo?.class || '',
                  level: selectedCharacter.character_data?.characterInfo?.level || 1,
                  race: selectedCharacter.character_data?.characterInfo?.race || '',
                  background: selectedCharacter.character_data?.characterInfo?.background || '',
                  alignment: selectedCharacter.character_data?.characterInfo?.alignment || ''
                }
              }}
              onCharacterSaved={handleSaveCharacter}
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
  );
}

export default App;
