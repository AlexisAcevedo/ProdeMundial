import React from 'react';

interface SuccessAnimationProps {
  className?: string;
  message?: string;
}

/**
 * Componente que muestra una micro-animación de éxito premium con trazado SVG animado.
 * Ideal para overlays temporales de confirmación.
 */
export function SuccessAnimation({ className = '', message = '¡Guardado!' }: SuccessAnimationProps) {
  return (
    <div className={`flex flex-col items-center justify-center animate-fade-in ${className}`}>
      {/* Círculo contenedor con check animado */}
      <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20 shadow-inner scale-0 animate-scale-up">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
            style={{
              strokeDasharray: 50,
              strokeDashoffset: 50,
              animation: 'drawCheck 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards',
            }}
          />
        </svg>
      </div>
      
      {message && (
        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-2.5 tracking-wider uppercase scale-0 animate-scale-up-delayed">
          {message}
        </span>
      )}

      {/* Inyección de estilos locales específicos para la micro-animación */}
      <style>{`
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-scale-up-delayed {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
