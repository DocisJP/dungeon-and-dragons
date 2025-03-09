import React from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CharacterList({ 
  characters, 
  onSelect, 
  onDelete, 
  useNewUI = false
}) {
  // Función de ayuda para mostrar los detalles del personaje de manera segura
  const getCharacterDetails = (character) => {
    const characterInfo = character.character_data?.characterInfo || {};
    return {
      race: characterInfo.race || '',
      class: characterInfo.class || '',
      level: characterInfo.level || ''
    };
  };

  return (
    <div>
      {characters.length === 0 ? (
        <div className="text-center py-8">
          <p className={`text-xl mb-4 ${useNewUI ? 'text-accent-foreground italic' : 'text-gray-500'}`}>
            No tienes personajes. ¡Crea uno nuevo!
          </p>
          <div className={useNewUI ? 'dnd-torchlight inline-block' : ''}>
            <svg 
              className={`w-20 h-20 mx-auto mb-4 ${useNewUI ? 'text-primary' : 'text-gray-400'}`}
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" 
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map(character => {
            const details = getCharacterDetails(character);
            
            return (
              <div 
                key={character.id}
                className={`
                  p-4 rounded relative transition 
                  ${useNewUI 
                    ? 'dnd-card cursor-pointer hover:shadow-lg group' 
                    : 'bg-white shadow hover:shadow-md'
                  }
                `}
                onClick={() => onSelect(character)}
              >
                <div>
                  <h2 className={`text-xl font-semibold ${useNewUI ? 'dnd-heading mb-2' : ''}`}>
                    {character.name || 'Personaje sin nombre'}
                  </h2>
                  <div className={`text-sm ${useNewUI ? 'text-accent-foreground/80' : 'text-gray-500'}`}>
                    <p>
                      {details.race && details.race} {details.class && details.class} {details.level && `Nivel ${details.level}`}
                    </p>
                    <p className="mt-1">
                      Actualizado: {new Date(character.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar este personaje?');
                    if (confirmDelete) {
                      onDelete(character.id);
                    }
                  }}
                  className={`
                    absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full 
                    ${useNewUI 
                      ? 'opacity-0 group-hover:opacity-100 bg-destructive text-white transition-opacity' 
                      : 'text-red-500 hover:text-red-700'
                    }
                  `}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
} 