import { useState, useEffect, useMemo, useRef } from 'react';
import type { Match, Prediction } from '../lib/types';
import { TeamFlag } from './MatchCard';
import { useToast } from '../contexts/ToastContext';

interface BulkPredictionViewProps {
  matches: Match[];
  predictions: Prediction[];
  onSubmitBulk: (items: { matchId: string; homeScore: number; awayScore: number }[]) => Promise<unknown>;
}

interface TempPrediction {
  matchId: string;
  homeScore: string;
  awayScore: string;
  isModified: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function BulkPredictionView({ matches, predictions, onSubmitBulk }: BulkPredictionViewProps) {
  const { addToast } = useToast();
  const [tempPredictions, setTempPredictions] = useState<Record<string, TempPrediction>>({});
  const [now, setNow] = useState(() => Date.now());
  const [savingStates, setSavingStates] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearInterval(interval);
      // Limpiar todos los timers de debounce al desmontar
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Filtrar partidos activos (predecibles)
  const activeMatches = useMemo(() => {
    return matches.filter((match) => {
      const isFinished = match.status === 'finished';
      const kickoffTime = new Date(match.kickoff_time).getTime();
      const isPastCutoff = now >= kickoffTime;
      return !isFinished && !isPastCutoff;
    });
  }, [matches, now]);

  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Filtrar por pendientes si el switch está activo
  const displayedMatches = useMemo(() => {
    return showOnlyPending
      ? activeMatches.filter((match) => !predictions.some((p) => p.match_id === match.id))
      : activeMatches;
  }, [activeMatches, showOnlyPending, predictions]);

  // Inicializar estado temporal con predicciones existentes
  useEffect(() => {
    const initial: Record<string, TempPrediction> = {};
    activeMatches.forEach((match) => {
      const pred = predictions.find((p) => p.match_id === match.id);
      initial[match.id] = {
        matchId: match.id,
        homeScore: pred?.home_score?.toString() ?? '',
        awayScore: pred?.away_score?.toString() ?? '',
        isModified: false,
      };
    });
    setTempPredictions(initial);
  }, [activeMatches, predictions]);

  const handleSaveMatch = async (matchId: string, home: string, away: string) => {
    if (home === '' || away === '') return;

    // Cancelar cualquier debounce pendiente
    if (debounceTimers.current[matchId]) {
      clearTimeout(debounceTimers.current[matchId]);
      delete debounceTimers.current[matchId];
    }

    setSavingStates((prev) => ({ ...prev, [matchId]: 'saving' }));

    try {
      const homeScore = Math.max(0, Math.min(99, parseInt(home, 10)));
      const awayScore = Math.max(0, Math.min(99, parseInt(away, 10)));

      await onSubmitBulk([{ matchId, homeScore, awayScore }]);
      
      setSavingStates((prev) => ({ ...prev, [matchId]: 'saved' }));
      
      // Volver a 'idle' después de 2 segundos
      setTimeout(() => {
        setSavingStates((prev) => ({ ...prev, [matchId]: 'idle' }));
      }, 2000);

      // Marcar como no modificado en el estado local
      setTempPredictions((prev) => {
        const current = prev[matchId];
        if (!current) return prev;
        return {
          ...prev,
          [matchId]: {
            ...current,
            isModified: false,
          },
        };
      });
    } catch (err: unknown) {
      setSavingStates((prev) => ({ ...prev, [matchId]: 'idle' }));
      addToast(err instanceof Error ? err.message : 'Error al guardar el pronóstico', 'error');
    }
  };

  const handleScoreChange = (matchId: string, type: 'home' | 'away', value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    // Si escribe goles de local, salta automáticamente al de visita
    if (type === 'home' && cleanValue.length > 0) {
      setTimeout(() => {
        inputRefs.current[matchId + '-away']?.focus();
      }, 10);
    }
    
    setTempPredictions((prev) => {
      const current = prev[matchId] || { matchId, homeScore: '', awayScore: '', isModified: false };
      const originalPred = predictions.find((p) => p.match_id === matchId);
      const originalHome = originalPred?.home_score?.toString() ?? '';
      const originalAway = originalPred?.away_score?.toString() ?? '';

      const updated = {
        ...current,
        [type === 'home' ? 'homeScore' : 'awayScore']: cleanValue,
      };

      const hasChanged = updated.homeScore !== originalHome || updated.awayScore !== originalAway;
      const isComplete = updated.homeScore !== '' && updated.awayScore !== '';

      // Debounce auto-guardado (800ms) si está completo y cambió
      if (hasChanged && isComplete) {
        if (debounceTimers.current[matchId]) {
          clearTimeout(debounceTimers.current[matchId]);
        }
        debounceTimers.current[matchId] = setTimeout(() => {
          handleSaveMatch(matchId, updated.homeScore, updated.awayScore);
        }, 800);
      }

      return {
        ...prev,
        [matchId]: {
          ...updated,
          isModified: hasChanged,
        },
      };
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, matchId: string, type: 'home' | 'away') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const temp = tempPredictions[matchId];
      if (type === 'home') {
        inputRefs.current[matchId + '-away']?.focus();
      } else if (temp && temp.homeScore !== '' && temp.awayScore !== '') {
        // Guardar inmediatamente si presiona Enter en Away y está completo
        handleSaveMatch(matchId, temp.homeScore, temp.awayScore);
        
        // Enfocar el input de Home del siguiente partido de la lista
        const currentIndex = displayedMatches.findIndex((m) => m.id === matchId);
        if (currentIndex !== -1 && currentIndex + 1 < displayedMatches.length) {
          const nextMatchId = displayedMatches[currentIndex + 1].id;
          setTimeout(() => {
            inputRefs.current[nextMatchId + '-home']?.focus();
          }, 50);
        }
      }
    }
  };

  const handleBlur = (matchId: string) => {
    const temp = tempPredictions[matchId];
    if (temp && temp.isModified && temp.homeScore !== '' && temp.awayScore !== '') {
      handleSaveMatch(matchId, temp.homeScore, temp.awayScore);
    }
  };

  if (activeMatches.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/50 p-6 dark:border-white/5 dark:bg-fifa-card/50 backdrop-blur-sm text-center">
        <span className="text-3xl mb-2">🔒</span>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Pronósticos Cerrados</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          No hay partidos disponibles para pronosticar en este momento. Todos los partidos activos ya comenzaron o finalizaron.
        </p>
      </div>
    );
  }

  const pendingMatchesCount = activeMatches.filter((match) => !predictions.some((p) => p.match_id === match.id)).length;

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Banner Informativo */}
      <div className="rounded-2xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/10 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
            Carga Rápida Inteligente
          </h4>
          <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1 leading-relaxed">
            Ingresá los goles y el cursor avanzará solo. Los cambios se guardan automáticamente tras 800ms de inactividad o al presionar <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 font-mono text-[10px] text-blue-800 dark:text-blue-300">Enter</kbd>.
          </p>
        </div>
      </div>

      {/* Filtros: Segmented Control */}
      <div className="flex items-center justify-between rounded-2xl bg-white/40 p-2 dark:bg-fifa-card/40 border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 px-3 uppercase tracking-wider">Filtros</span>
        <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-fifa-dark/60 border border-slate-200/20 dark:border-white/5 w-60 sm:w-64">
          <button
            type="button"
            onClick={() => setShowOnlyPending(false)}
            className={`flex-1 rounded-lg py-1.5 px-3 text-xs font-bold transition-all ${
              !showOnlyPending
                ? 'bg-white text-slate-800 shadow-sm dark:bg-fifa-card dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyPending(true)}
            className={`flex-1 rounded-lg py-1.5 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              showOnlyPending
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>Pendientes</span>
            {pendingMatchesCount > 0 && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-md font-extrabold ${
                showOnlyPending ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'
              }`}>
                {pendingMatchesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grid de partidos compactos o Estado Vacío */}
      {displayedMatches.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/50 p-6 dark:border-white/5 dark:bg-fifa-card/50 backdrop-blur-sm text-center">
          <span className="text-3xl mb-2">🎉</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">¡Estás al día!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            No tenés partidos pendientes por pronosticar. Desactivá el filtro de "Pendientes" arriba si querés modificar tus pronósticos cargados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedMatches.map((match) => {
            const temp = tempPredictions[match.id] || { homeScore: '', awayScore: '', isModified: false };
            const isSaving = savingStates[match.id] === 'saving';
            const isSaved = savingStates[match.id] === 'saved';
            const isModified = temp.isModified && temp.homeScore !== '' && temp.awayScore !== '';
            
            return (
              <div
                key={match.id}
                className={`rounded-xl border bg-white px-4 py-3 shadow-sm dark:bg-fifa-card transition-all duration-300 flex items-center justify-between gap-4 ${
                  isSaving
                    ? 'border-brand-500 dark:border-brand-500/50 ring-1 ring-brand-500/20'
                    : isSaved
                    ? 'border-emerald-500 dark:border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : temp.isModified
                    ? 'border-amber-500 dark:border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'border-slate-200/60 dark:border-white/5'
                }`}
              >
                {/* Info de partido */}
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {dateFormatter.format(new Date(match.kickoff_time))} {match.group_letter ? `• Grupo ${match.group_letter}` : ''}
                  </span>
                  
                  <div className="flex items-center gap-2 mt-1 font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm truncate">
                    <TeamFlag teamName={match.home_team} />
                    <span className="truncate">{match.home_team}</span>
                    <span className="text-slate-400 dark:text-slate-600 font-bold shrink-0">vs</span>
                    <span className="truncate">{match.away_team}</span>
                    <TeamFlag teamName={match.away_team} />
                  </div>
                </div>

                {/* Inputs de goles compactos y botón de estado */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    ref={(el) => { inputRefs.current[match.id + '-home'] = el; }}
                    value={temp.homeScore}
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, match.id, 'home')}
                    onBlur={() => handleBlur(match.id)}
                    disabled={isSaving}
                    maxLength={2}
                    className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-black outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white dark:focus:border-brand-500"
                    placeholder="-"
                  />
                  <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    ref={(el) => { inputRefs.current[match.id + '-away'] = el; }}
                    value={temp.awayScore}
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, match.id, 'away')}
                    onBlur={() => handleBlur(match.id)}
                    disabled={isSaving}
                    maxLength={2}
                    className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-black outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white dark:focus:border-brand-500"
                    placeholder="-"
                  />
                  
                  {/* Botón/Icono de Guardado Inline */}
                  <div className="w-8 h-8 flex items-center justify-center ml-1">
                    {isSaving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    ) : isSaved ? (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isModified ? (
                      <button
                        type="button"
                        onClick={() => handleSaveMatch(match.id, temp.homeScore, temp.awayScore)}
                        className="p-1 rounded-md bg-emerald-500 hover:bg-emerald-600 active:scale-90 text-white transition-all shadow-sm flex items-center justify-center"
                        title="Guardar pronóstico"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    ) : predictions.some(p => p.match_id === match.id) ? (
                      <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <title>Guardado</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-700 text-xs font-bold">-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
