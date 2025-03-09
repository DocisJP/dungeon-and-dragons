import React, { useState, useEffect, createContext, useContext, useCallback } from "react";

// Tipos de toast con sus colores
const TOAST_TYPES = {
  success: {
    bg: "bg-green-100",
    border: "border-green-800",
    text: "text-green-900",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
  error: {
    bg: "bg-red-100",
    border: "border-red-800",
    text: "text-red-900",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  },
  warning: {
    bg: "bg-amber-100",
    border: "border-amber-800",
    text: "text-amber-900",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  },
  info: {
    bg: "bg-blue-100",
    border: "border-blue-800",
    text: "text-blue-900",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
};

// Toast Context para gestionar los toasts en la aplicación
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook para usar el toast desde cualquier componente
export function useToast() {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Función global para mostrar toasts (para usar en situaciones donde no se puede usar el hook)
let globalAddToast = null;
export function setGlobalToast(addToast) {
  globalAddToast = addToast;
}

export function showToast(message, type = "info", duration = 3000) {
  if (globalAddToast) {
    return globalAddToast(message, type, duration);
  }
  // Fallback a alert si no hay globalAddToast configurado
  alert(message);
  return null;
}

// Función para cerrar un toast específico (compatible con versión anterior)
export function closeToast(id) {
  // Esta función se mantiene por compatibilidad, pero su funcionalidad
  // se maneja ahora dentro del ToastProvider
  console.warn("closeToast is deprecated, use the removeToast method from useToast() instead");
}

// Componente Toast
function Toast({ id, message, type = "info", duration = 3000, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const { bg, border, text, icon } = TOAST_TYPES[type] || TOAST_TYPES.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Clase para el estilo de D&D
  const dndClass = `
    p-4 rounded-md shadow-md 
    ${bg} ${border} ${text} border-2
    flex items-start gap-3 
    transition-all duration-300 ease-in-out 
    relative overflow-hidden
  `;
  
  // Agregar animación para entrada/salida
  const animationClass = isExiting 
    ? "opacity-0 transform translate-x-5" 
    : "opacity-100 transform translate-x-0";

  return (
    <div className={`${dndClass} ${animationClass}`}>
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-grow font-medium">{message}</div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => {
            onClose();
          }, 300);
        }}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Barra de progreso */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-current opacity-40"
        style={{
          width: "100%",
          animation: `toast-progress ${duration}ms linear forwards`
        }}
      />
    </div>
  );
}

// Añadir estilos CSS para la animación de progreso
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toast-progress {
      0% { width: 100%; }
      100% { width: 0%; }
    }
  `;
  
  // Verificar si el estilo ya existe para evitar duplicados
  if (!document.head.querySelector('style[data-toast-style]')) {
    style.setAttribute('data-toast-style', 'true');
    document.head.appendChild(style);
  }
}

export default Toast; 