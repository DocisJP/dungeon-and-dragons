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