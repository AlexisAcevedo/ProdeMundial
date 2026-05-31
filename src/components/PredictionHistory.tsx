import { useState } from 'react';
import { usePredictionHistory } from '../hooks/usePredictionHistory';
import type { Match, Prediction } from '../lib/types';
import { TeamFlag } from './MatchCard';
import { MatchPredictionsList } from './MatchPredictionsList';

interface PredictionHistoryProps {
  matches: Match[];
  predictions: Prediction[];
}

export function PredictionHistory({ matches, predictions }: PredictionHistoryProps) {
  const { history, totalPoints } = usePredictionHistory(matches, predictions);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const formatter = new Intl.DateTimeFormat('es', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Estadísticas del historial
  const exactHits = history.filter((item) => item.points === 3).length;
  const outcomeHits = history.filter((item) => item.points === 1).length;
  const misses = history.filter((item) => item.prediction && item.points === 0).length;
  const noPredictions = history.filter((item) => !item.prediction).length;

  if (history.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white/50 p-6 dark:border-white/5 dark:bg-fifa-card/50 backdrop-blur-sm text-center">
        <span className="text-3xl mb-2">⚽</span>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Historial vacío</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Aún no finalizó ningún partido del torneo. Cuando se carguen los resultados oficiales, vas a poder ver tu historial y puntos acumulados acá.
        </p>
      </div>
    );
  }

  const toggleOthers = (matchId: string) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de puntos y estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-fifa-card flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/5 blur-xl rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Puntos Totales
            </span>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white mt-1">
              {totalPoints} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">pts</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            Acumulados en todos tus pronósticos finalizados.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/50 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-fifa-card sm:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
            Resumen de Aciertos
          </span>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">Exacto (+3)</span>
              <span data-testid="exact-hits" className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">{exactHits}</span>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">Ganador (+1)</span>
              <span data-testid="outcome-hits" className="text-xl font-black text-blue-600 dark:text-blue-400 block mt-1">{outcomeHits}</span>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">Errados (0)</span>
              <span data-testid="misses" className="text-xl font-black text-slate-600 dark:text-slate-400 block mt-1">{misses}</span>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">Sin Pronosticar</span>
              <span data-testid="no-predictions" className="text-xl font-black text-slate-400 dark:text-slate-600 block mt-1">{noPredictions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de partidos en el historial */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Resultados de tus Pronósticos
        </h3>
        
        <div className="space-y-3">
          {history.map(({ match, prediction, points }) => {
            const isExpanded = expandedMatchId === match.id;
            
            return (
              <div
                key={match.id}
                className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-fifa-card hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Decorative border matching score status */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                  points === 3
                    ? 'bg-amber-500'
                    : points === 1
                    ? 'bg-emerald-500'
                    : prediction
                    ? 'bg-slate-300 dark:bg-slate-700'
                    : 'bg-red-500'
                }`} />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ml-2">
                  {/* Left section: Date and Match Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      {formatter.format(new Date(match.kickoff_time))} {match.group_letter ? `• Grupo ${match.group_letter}` : ''}
                    </span>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white text-sm truncate">
                        <TeamFlag teamName={match.home_team} />
                        <span>{match.home_team}</span>
                        <span className="text-slate-400 dark:text-slate-600 font-black">VS</span>
                        <span>{match.away_team}</span>
                        <TeamFlag teamName={match.away_team} />
                      </div>
                    </div>
                  </div>

                  {/* Middle section: Scores and Predictions */}
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-2 rounded-xl border border-slate-100 dark:border-white/5 self-start sm:self-auto">
                    <div className="text-center px-2">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Real</span>
                      <span className="text-base font-black text-slate-800 dark:text-white">
                        {match.home_score} - {match.away_score}
                      </span>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

                    <div className="text-center px-2">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Tu Prode</span>
                      {prediction ? (
                        <span className="text-base font-black text-slate-700 dark:text-slate-200">
                          {prediction.home_score} - {prediction.away_score}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-500 block py-0.5">
                          Sin cargar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right section: Points Badge & Community predictions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    <button
                      onClick={() => toggleOthers(match.id)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors flex items-center gap-0.5"
                    >
                      <span>Comunidad</span>
                      <svg className={`w-3.5 h-3.5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <div className={`text-xs font-bold px-3 py-1.5 rounded-full text-center min-w-[70px] ${
                      points === 3
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30'
                        : points === 1
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30'
                        : prediction
                        ? 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200/50 dark:border-white/5'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30'
                    }`}>
                      {points === 3 ? 'Exacto +3' : points === 1 ? 'Ganador +1' : prediction ? '0 pts' : '0 pts'}
                    </div>
                  </div>
                </div>

                {/* Expanded Community Predictions */}
                {isExpanded && (
                  <div className="mt-3 border-t border-slate-100 pt-1.5 dark:border-white/5 pl-2">
                    <MatchPredictionsList
                      matchId={match.id}
                      isPastCutoff={true}
                      isFinished={true}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
