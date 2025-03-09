import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import CharacterSheet from './components/CharacterSheet';
import Auth from './components/Auth';
import CharacterList from './components/CharacterList';
import Layout from './components/Layout';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

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

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  // Si el usuario no está autenticado, mostrar pantalla de login
  if (!session) {
    return <Auth />;
  }

  // Mostrar lista de personajes o el personaje seleccionado
  return (
    <Layout 
      showBackButton={!!selectedCharacter} 
      onBack={() => setSelectedCharacter(null)}
    >
      {selectedCharacter ? (
        <CharacterSheet 
          characterId={selectedCharacter} 
          onCharacterSaved={(id) => {
            fetchCharacters();
            setSelectedCharacter(id);
          }}
        />
      ) : (
        <CharacterList 
          characters={characters}
          onSelect={setSelectedCharacter}
          onDelete={deleteCharacter}
          onCreate={createNewCharacter}
          onLogout={handleLogout}
        />
      )}
    </Layout>
  );
}

export default App
