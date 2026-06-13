import { useEffect } from 'react';

interface RulesModalProps {
  onClose: () => void;
}

export function RulesModal({ onClose }: RulesModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl dark:bg-fifa-card border border-slate-200/50 dark:border-white/5 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Close Button (X) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Reglas y Puntuación
        </h3>

        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Scoring Section */}
          <section>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-base flex items-center gap-2">
              <span className="text-xl">🎯</span> Sistema de Puntos
            </h4>
            <ul className="space-y-3 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <li className="flex gap-3">
                <span className="font-extrabold text-brand-600 dark:text-brand-400 min-w-[30px]">+3</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Resultado Exacto</p>
                  <p className="text-xs mt-0.5 opacity-80">Acertás la cantidad exacta de goles de ambos equipos. Ej: Pronosticaste 2-1 y el partido termina 2-1.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 min-w-[30px]">+1</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Ganador o Empate (Tendencia)</p>
                  <p className="text-xs mt-0.5 opacity-80">No le atinás al resultado exacto, pero sí a quién gana o si hay empate. Ej: Pronosticaste 2-0 y el partido termina 3-1.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-extrabold text-slate-400 min-w-[30px]">0</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Resultado Incorrecto</p>
                  <p className="text-xs mt-0.5 opacity-80">El ganador o el empate no coincide con tu pronóstico.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Awards Section */}
          <section>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-base flex items-center gap-2">
              <span className="text-xl">🏆</span> Premios y Estadísticas
            </h4>
            <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200/90">
              <p className="mb-3 text-sm font-medium">Al participar en una liga, competís automáticamente por estos títulos honoríficos:</p>
              <ul className="grid gap-3 sm:grid-cols-2 text-xs">
                <li className="flex items-start gap-2 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-500/10">
                  <span className="text-base">👑</span>
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Rey del Exacto</strong>
                    <span className="opacity-80">Más aciertos del marcador exacto.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-500/10">
                  <span className="text-base">🔥</span>
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Mejor Racha</strong>
                    <span className="opacity-80">Más partidos seguidos sumando puntos.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-500/10">
                  <span className="text-base">😎</span>
                  <div>
                    <strong className="block text-slate-900 dark:text-white">El Optimista</strong>
                    <span className="opacity-80">Más goles totales pronosticados.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-500/10">
                  <span className="text-base">💩</span>
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Rey del Crap</strong>
                    <span className="opacity-80">Más pronósticos errados (0 puntos).</span>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Rules Section */}
          <section>
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-base flex items-center gap-2">
              <span className="text-xl">⚖️</span> Reglas Generales
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-xs opacity-90">
              <li><strong>Tiempo Límite:</strong> Tenés hasta <strong>30 minutos antes</strong> del inicio de cada partido para cargar o modificar tu pronóstico. Después de eso, el partido se bloquea.</li>
              <li><strong>Fases Finales:</strong> En los partidos de eliminación directa (desde 16avos hasta la final), el resultado válido para el Prode es el de los <strong>90 minutos reglamentarios</strong> (más el tiempo agregado por el árbitro). No se cuentan goles de alargue (tiempo extra) ni penales.</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 text-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-sm transition-all shadow-md shadow-brand-500/20"
          >
            ¡Entendido!
          </button>
        </div>

      </div>
    </div>
  );
}
