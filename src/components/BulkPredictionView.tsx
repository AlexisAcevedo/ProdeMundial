import { useState, useEffect, useMemo } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
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

  const [showOnlyPending, setShowOnlyPending] = useState(() => {
    return activeMatches.some((match) => !predictions.some((p) => p.match_id === match.id));
  });

  // Filtrar por pendientes si el switch está activo
  const displayedMatches = showOnlyPending
    ? activeMatches.filter((match) => !predictions.some((p) => p.match_id === match.id))
    : activeMatches;

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempPredictions(initial);
  }, [activeMatches, predictions]);

  const handleScoreChange = (matchId: string, type: 'home' | 'away', value: string) => {
    // Filtrar caracteres que no sean dígitos
    const cleanValue = value.replace(/\D/g, '');
    
    setTempPredictions((prev) => {
      const current = prev[matchId] || { matchId, homeScore: '', awayScore: '', isModified: false };
      const originalPred = predictions.find((p) => p.match_id === matchId);
      const originalHome = originalPred?.home_score?.toString() ?? '';
      const originalAway = originalPred?.away_score?.toString() ?? '';

      const updated = {
        ...current,
        [type === 'home' ? 'homeScore' : 'awayScore']: cleanValue,
      };

      // Determinar si realmente cambió respecto al original de la base de datos
      const hasChanged = updated.homeScore !== originalHome || updated.awayScore !== originalAway;

      return {
        ...prev,
        [matchId]: {
          ...updated,
          isModified: hasChanged,
        },
      };
    });
  };

  // Obtener los ítems modificados que están completos (ambos inputs llenos)
  const getModifiedItems = () => {
    return Object.values(tempPredictions).filter(
      (item) => item.isModified && item.homeScore !== '' && item.awayScore !== ''
    );
  };

  const modifiedItems = getModifiedItems();
  const hasChanges = modifiedItems.length > 0;

  const handleSaveAll = async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      const itemsToSubmit = modifiedItems.map((item) => ({
        matchId: item.matchId,
        homeScore: Math.max(0, Math.min(99, parseInt(item.homeScore, 10))),
        awayScore: Math.max(0, Math.min(99, parseInt(item.awayScore, 10))),
      }));

      await onSubmitBulk(itemsToSubmit);
      addToast(`¡Se guardaron ${itemsToSubmit.length} pronósticos con éxito!`, 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Error al guardar los pronósticos masivos', 'error');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Banner Informativo */}
      <div className="rounded-2xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/10 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
            Carga Rápida Activa
          </h4>
          <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
            Completá o modificá los goles de los partidos que quieras y guardá todo junto en una sola operación. Los partidos modificados se marcarán con un borde verde.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between rounded-2xl bg-white/40 p-2.5 dark:bg-fifa-card/40 border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">Filtros disponibles</span>
        <button
          type="button"
          onClick={() => setShowOnlyPending(!showOnlyPending)}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 border ${
            showOnlyPending
              ? 'bg-amber-500 text-white border-amber-400/35 shadow-md shadow-amber-500/10'
              : 'text-slate-500 border-slate-200 hover:text-slate-700 dark:text-slate-400 dark:border-white/5 dark:hover:text-slate-200'
          }`}
        >
          <span>⚡ Solo pendientes</span>
        </button>
      </div>

      {/* Grid de partidos compactos o Estado Vacío */}
      {displayedMatches.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/50 p-6 dark:border-white/5 dark:bg-fifa-card/50 backdrop-blur-sm text-center">
          <span className="text-3xl mb-2">🎉</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">¡Estás al día!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            No tenés partidos pendientes por pronosticar. Desactivá el filtro de "Solo pendientes" arriba si querés modificar tus pronósticos cargados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedMatches.map((match) => {
            const temp = tempPredictions[match.id] || { homeScore: '', awayScore: '', isModified: false };
            
            return (
              <div
                key={match.id}
                className={`rounded-xl border bg-white px-4 py-3 shadow-sm dark:bg-fifa-card transition-colors flex items-center justify-between gap-4 ${
                  temp.isModified
                    ? 'border-emerald-500 dark:border-emerald-500/50 ring-1 ring-emerald-500/20'
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

                {/* Inputs de goles compactos */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={temp.homeScore}
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                    disabled={isSubmitting}
                    maxLength={2}
                    className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-black outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white dark:focus:border-brand-500"
                    placeholder="-"
                  />
                  <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={temp.awayScore}
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                    disabled={isSubmitting}
                    maxLength={2}
                    className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-black outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white dark:focus:border-brand-500"
                    placeholder="-"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón flotante/fijo de Guardar Cambios */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 animate-slide-up">
          <button
            onClick={handleSaveAll}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 px-6 text-sm font-black text-white transition-all hover:from-emerald-500 hover:to-emerald-400 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Guardar {modifiedItems.length} pronósticos</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
