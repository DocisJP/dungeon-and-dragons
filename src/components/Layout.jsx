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