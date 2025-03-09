# Plan de Implementación: Hoja de Personaje D&D con React + Vite + pnpm + Supabase

## Descripción General

Este plan detalla la implementación de una aplicación web para hojas de personaje de D&D 5e, utilizando React con Vite como bundler, pnpm como gestor de paquetes y Supabase como backend. La aplicación permitirá a los usuarios crear, editar, guardar y compartir hojas de personaje con la estructura exacta del componente CharacterSheet proporcionado.

## Requisitos

- Mantener el componente CharacterSheet exactamente como está
- Usar Vite en lugar de Create React App (deprecado)
- Usar pnpm como gestor de paquetes
- Implementar autenticación de usuarios
- Almacenamiento en la nube de personajes
- Mantener la simplicidad y usabilidad

## Estructura del Proyecto

```
dnd-character-sheet/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Auth.jsx             # Componente de autenticación
│   │   ├── CharacterSheet.jsx   # Componente principal (existente)
│   │   ├── CharacterList.jsx    # Lista de personajes
│   │   └── Layout.jsx           # Estructura de navegación 
│   ├── lib/
│   │   └── supabaseClient.js    # Cliente de Supabase
│   ├── App.jsx                  # Componente principal
│   ├── main.jsx                 # Punto de entrada (equivalente a index.js en CRA)
│   └── index.css                # Estilos globales (Tailwind)
├── .env                         # Variables de entorno (no incluir en Git)
├── tailwind.config.js           # Configuración de Tailwind 
├── vite.config.js               # Configuración de Vite
└── package.json                 # Dependencias del proyecto
```

## Plan de Implementación Paso a Paso

### Fase 1: Configuración Inicial (Tiempo estimado: 10 minutos)

1. **Crear proyecto React con Vite**
   ```bash
   pnpm create vite dnd-character-sheet --template react
   cd dnd-character-sheet
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   pnpm add @supabase/supabase-js
   pnpm add -D tailwindcss postcss autoprefixer
   pnpm exec tailwindcss init -p
   ```

3. **Configurar Tailwind CSS**
   - Editar `tailwind.config.js`:
   ```js
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```
   - Actualizar `src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

4. **Configurar variables de entorno para Vite**
   - Crear archivo `.env` (asegúrate de agregarlo a .gitignore):
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-key
   ```

### Fase 2: Configuración de Supabase (Tiempo estimado: 15 minutos)

1. **Crear cuenta y proyecto en Supabase**
   - Visitar [supabase.com](https://supabase.com/)
   - Crear una cuenta nueva o iniciar sesión
   - Crear un nuevo proyecto
   - Anotar URL y API Key (anon/public)

2. **Configurar base de datos**
   - En el panel de Supabase, ir a SQL Editor
   - Ejecutar el siguiente script SQL:

   ```sql
   -- Crear tabla para personajes
   CREATE TABLE characters (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     character_data JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Crear índices para mejorar rendimiento
   CREATE INDEX characters_user_id_idx ON characters(user_id);
   CREATE INDEX characters_name_idx ON characters(name);

   -- Configurar trigger para actualizar el timestamp de updated_at automáticamente
   CREATE OR REPLACE FUNCTION update_modified_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER update_characters_timestamp
   BEFORE UPDATE ON characters
   FOR EACH ROW
   EXECUTE PROCEDURE update_modified_column();

   -- Configurar RLS (Row Level Security) para la tabla characters
   ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

   -- Crear políticas de seguridad para la tabla characters
   CREATE POLICY "Users can view their own characters" 
   ON characters 
   FOR SELECT 
   USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own characters" 
   ON characters 
   FOR INSERT 
   WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own characters" 
   ON characters 
   FOR UPDATE 
   USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own characters" 
   ON characters 
   FOR DELETE 
   USING (auth.uid() = user_id);

   -- Establecer valores predeterminados y restricciones
   ALTER TABLE characters 
     ALTER COLUMN character_data SET DEFAULT '{}',
     ADD CONSTRAINT character_data_not_empty CHECK (character_data != 'null'::jsonb);
   ```

3. **Configurar autenticación en Supabase**
   - En el panel de Supabase, ir a Authentication > Settings
   - Habilitar Email auth y configurar ajustes básicos

### Fase 3: Implementación del Cliente (Tiempo estimado: 5 minutos)

1. **Crear cliente de Supabase**
   - Crear archivo `src/lib/supabaseClient.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

### Fase 4: Implementación de Componentes (Tiempo estimado: 30 minutos)

1. **Crear componente de autenticación (`src/components/Auth.jsx`)**
   ```jsx
   import React, { useState } from 'react'
   import { supabase } from '../lib/supabaseClient'

   export default function Auth() {
     const [loading, setLoading] = useState(false)
     const [email, setEmail] = useState('')
     const [password, setPassword] = useState('')
     const [message, setMessage] = useState('')

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
       <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
         <h1 className="text-2xl font-bold text-center mb-6">D&D Character Sheets</h1>
         <form className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
             <input
               className="w-full p-2 border rounded"
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
             <input
               className="w-full p-2 border rounded"
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
             />
           </div>
           
           {message && (
             <div className="p-2 text-sm bg-blue-50 text-blue-800 rounded">{message}</div>
           )}
           
           <div className="grid grid-cols-2 gap-4">
             <button
               onClick={handleSignUp}
               disabled={loading}
               className="p-2 bg-gray-200 rounded hover:bg-gray-300"
             >
               Registrarse
             </button>
             <button
               onClick={handleLogin}
               disabled={loading}
               className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
             >
               Iniciar Sesión
             </button>
           </div>
         </form>
       </div>
     )
   }
   ```

2. **Crear componente de lista de personajes (`src/components/CharacterList.jsx`)**
   ```jsx
   import React from 'react'
   import { supabase } from '../lib/supabaseClient'

   export default function CharacterList({ 
     characters, 
     onSelect, 
     onDelete, 
     onCreate,
     onLogout 
   }) {
     return (
       <div className="container mx-auto p-6">
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-3xl font-bold">Mis Personajes D&D</h1>
           <button 
             onClick={onLogout}
             className="px-4 py-2 text-gray-700 hover:text-gray-900"
           >
             Cerrar Sesión
           </button>
         </div>
         
         <button 
           onClick={onCreate}
           className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
         >
           + Crear Nuevo Personaje
         </button>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {characters.map(character => (
             <div 
               key={character.id}
               className="p-4 bg-white rounded shadow hover:shadow-md transition relative"
             >
               <div 
                 className="cursor-pointer"
                 onClick={() => onSelect(character.id)}
               >
                 <h2 className="text-xl font-semibold">{character.name}</h2>
                 <p className="text-sm text-gray-500">
                   Actualizado: {new Date(character.updated_at).toLocaleString()}
                 </p>
               </div>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   onDelete(character.id);
                 }}
                 className="absolute top-2 right-2 text-red-500 hover:text-red-700"
               >
                 X
               </button>
             </div>
           ))}
           
           {characters.length === 0 && (
             <p className="text-gray-500">No tienes personajes. ¡Crea uno nuevo!</p>
           )}
         </div>
       </div>
     )
   }
   ```

3. **Crear componente de layout (`src/components/Layout.jsx`)**
   ```jsx
   import React from 'react'

   export default function Layout({ children, onBack, showBackButton }) {
     return (
       <div className="min-h-screen bg-gray-100">
         {showBackButton && (
           <div className="p-4">
             <button 
               onClick={onBack}
               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
             >
               ← Volver a la lista
             </button>
           </div>
         )}
         {children}
       </div>
     )
   }
   ```

4. **Modificar `CharacterSheet.jsx`**
   - Renombrar el archivo original a .jsx por consistencia
   - Agregar las siguientes importaciones al inicio del archivo:
   ```jsx
   import { supabase } from '../lib/supabaseClient';
   ```
   
   - Agregar el siguiente código después de la declaración de estados existente:

   ```jsx
   // Estado para control de carga y guardado
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   
   // Cargar datos del personaje
   useEffect(() => {
     if (characterId) {
       fetchCharacter();
     } else {
       setLoading(false);
     }
   }, [characterId]);
   
   // Función para cargar el personaje desde Supabase
   const fetchCharacter = async () => {
     try {
       setLoading(true);
       
       const { data, error } = await supabase
         .from('characters')
         .select('*')
         .eq('id', characterId)
         .single();
       
       if (error) {
         throw error;
       }
       
       if (data && data.character_data) {
         // Establecer todos los estados desde character_data
         const charData = data.character_data;
         
         // Cargar datos en los estados correspondientes
         if (charData.attributes) setAttributes(charData.attributes);
         if (charData.skills) setSkills(charData.skills);
         if (charData.characterInfo) setCharacterInfo(charData.characterInfo);
         if (charData.equipment) setEquipment(charData.equipment);
         if (charData.spells) setSpells(charData.spells);
       }
     } catch (error) {
       console.error('Error fetching character:', error);
     } finally {
       setLoading(false);
     }
   };
   
   // Función para guardar el personaje en Supabase
   const saveCharacter = async () => {
     try {
       setSaving(true);
       
       // Recopilar todos los datos del personaje
       const characterData = {
         attributes,
         skills,
         characterInfo,
         equipment,
         spells
       };
       
       if (characterId) {
         // Actualizar personaje existente
         const { error } = await supabase
           .from('characters')
           .update({ 
             character_data: characterData,
             name: characterInfo.name || 'Personaje sin nombre',
             updated_at: new Date()
           })
           .eq('id', characterId);
           
         if (error) throw error;
       } else {
         // Crear nuevo personaje
         const { data, error } = await supabase
           .from('characters')
           .insert([{ 
             character_data: characterData,
             name: characterInfo.name || 'Personaje sin nombre'
           }])
           .select();
           
         if (error) throw error;
         
         // Llamar al callback con el nuevo ID
         if (data && data[0] && onCharacterSaved) {
           onCharacterSaved(data[0].id);
         }
       }
       
       alert('Personaje guardado con éxito');
     } catch (error) {
       console.error('Error saving character:', error);
       alert('Error al guardar el personaje');
     } finally {
       setSaving(false);
     }
   };
   ```

   - Agregar el botón de guardar y modificar el return:

   ```jsx
   // Agregar antes del return final
   const renderSaveButton = () => (
     <div className="mt-6 text-center">
       <button
         onClick={saveCharacter}
         disabled={saving}
         className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
       >
         {saving ? 'Guardando...' : 'Guardar Personaje'}
       </button>
     </div>
   );
   
   // Modificar el return para ser así:
   return (
     <div className="max-w-4xl mx-auto bg-gray-100 p-6 rounded-lg shadow-lg">
       {loading ? (
         <div className="text-center py-10">
           <p>Cargando personaje...</p>
         </div>
       ) : (
         <>
           <h1 className="text-2xl font-bold text-center mb-6">Hoja de Personaje D&D 5e</h1>
           
           {/* Tabs */}
           <div className="flex border-b mb-4">
             {tabs.map((tab, index) => (
               <button
                 key={index}
                 className={`py-2 px-4 font-medium ${activeTab === index ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                 onClick={() => setActiveTab(index)}
               >
                 {tab.title}
               </button>
             ))}
           </div>
           
           {/* Active Tab Content */}
           {tabs[activeTab].content}
           
           {/* Save Button */}
           {renderSaveButton()}
           
           <div className="mt-4 text-center text-gray-500 text-sm">
             Hoja de personaje para D&D 5e. Los cambios se guardan al presionar el botón.
           </div>
         </>
       )}
     </div>
   );
   ```

5. **Actualizar App.jsx**
   ```jsx
   import React, { useState, useEffect } from 'react';
   import { supabase } from './lib/supabaseClient';
   import CharacterSheet from './components/CharacterSheet';
   import Auth from './components/Auth';
   import CharacterList from './components/CharacterList';
   import Layout from './components/Layout';

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
         
         const { data, error } = await supabase
           .from('characters')
           .select('id, name, created_at, updated_at')
           .order('updated_at', { ascending: false });
         
         if (error) throw error;
         
         setCharacters(data || []);
       } catch (error) {
         console.error('Error fetching characters:', error);
       } finally {
         setLoading(false);
       }
     };

     // Crear un nuevo personaje
     const createNewCharacter = async () => {
       try {
         const { data, error } = await supabase
           .from('characters')
           .insert([{
             name: `Personaje ${characters.length + 1}`,
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
         
         if (error) throw error;
         
         if (data && data[0]) {
           await fetchCharacters(); // Recargar la lista
           setSelectedCharacter(data[0].id);
         }
       } catch (error) {
         console.error('Error creating character:', error);
         alert('Error al crear el personaje');
       }
     };

     // Eliminar un personaje
     const deleteCharacter = async (id) => {
       if (window.confirm('¿Estás seguro de eliminar este personaje?')) {
         try {
           const { error } = await supabase
             .from('characters')
             .delete()
             .eq('id', id);
           
           if (error) throw error;
           
           fetchCharacters();
           if (selectedCharacter === id) {
             setSelectedCharacter(null);
           }
         } catch (error) {
           console.error('Error deleting character:', error);
           alert('Error al eliminar el personaje');
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

   export default App;
   ```

6. **Actualizar `main.jsx`**
   ```jsx
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App.jsx'
   import './index.css'

   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <App />
     </React.StrictMode>,
   )
   ```

### Fase 5: Pruebas (Tiempo estimado: 10 minutos)

1. **Ejecutar la aplicación localmente**
   ```bash
   pnpm dev
   ```

2. **Probar funcionalidades principales**
   - Registro e inicio de sesión
   - Creación de personajes
   - Edición de personajes
   - Guardado de personajes
   - Eliminación de personajes
   - Cerrar sesión

### Fase 6: Despliegue (Tiempo estimado: 10 minutos)

1. **Preparar para producción**
   ```bash
   pnpm build
   ```

2. **Desplegar en Vercel**
   - Crear cuenta en Vercel si no tienes
   - Conectar con repositorio Git
   - Configurar variables de entorno en Vercel:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Desplegar

## Resumen de Tiempos

- Configuración inicial: 10 minutos
- Configuración de Supabase: 15 minutos
- Implementación del cliente: 5 minutos
- Implementación de componentes: 30 minutos
- Pruebas: 10 minutos
- Despliegue: 10 minutos

**Tiempo total estimado: 80 minutos (1 hora y 20 minutos)**

## Notas Adicionales

1. **Diferencias con Create React App**
   - Vite es significativamente más rápido en desarrollo y construcción
   - La estructura de archivos es ligeramente diferente (.jsx en lugar de .js)
   - Las variables de entorno usan `import.meta.env.VITE_*` en lugar de `process.env.REACT_APP_*`
   - El archivo principal es `main.jsx` en lugar de `index.js`

2. **Ventajas de pnpm**
   - Más eficiente en el uso de espacio en disco
   - Más rápido que npm y yarn
   - Manejo más seguro de dependencias

3. **Consideraciones de Seguridad**
   - Las políticas RLS de Supabase garantizan que cada usuario solo pueda ver y modificar sus propios personajes
   - La autenticación por email es segura y mantenida por Supabase

4. **Escalabilidad**
   - Este diseño es escalable para cientos de usuarios en el plan gratuito
   - Para miles de usuarios, considerar actualizar a un plan superior

5. **Funcionalidades futuras**
   - Compartir personajes entre usuarios
   - Exportar a PDF
   - Modo para el Dungeon Master
   - Tiradas de dados integradas