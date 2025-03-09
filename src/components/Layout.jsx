import React from 'react'

export default function Layout({ children, onBack, showBackButton, useNewUI }) {
  return (
    <div className="min-h-screen">
      {showBackButton && (
        <header className="bg-gray-800 text-white shadow-md mb-6 dark:bg-gray-900">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <button 
              onClick={onBack}
              className={`px-4 py-2 rounded flex items-center ${useNewUI ? 'dnd-button' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              <span className="mr-1">←</span> Volver a la lista
            </button>
          </div>
        </header>
      )}
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  )
} 