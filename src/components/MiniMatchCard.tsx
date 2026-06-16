import { useState, useEffect } from 'react';
import type { Match, Prediction } from '../lib/types';
import { TeamFlag } from './MatchCard';
import { CountdownTimer } from './CountdownTimer';
import { useToast } from '../contexts/ToastContext';
import { MatchPredictionsList } from './MatchPredictionsList';

const dateFormatter = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
});

export function MiniMatchCard({ match, prediction, onSubmit }: { match: Match, prediction?: Prediction, onSubmit: (matchId: string, home: number, away: number) => Promise<void> }) {
  const [homeScore, setHomeScore] = useState<string>(prediction?.home_score?.toString() ?? '');
  const [awayScore, setAwayScore] = useState<string>(prediction?.away_score?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const [now, setNow] = useState(() => Date.now());
  const [showOthers, setShowOthers] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const isFinished = match.status === 'finished';
  const isInProgress = match.status === 'in_progress';
  const kickoffTime = new Date(match.kickoff_time).getTime();
  const isPastCutoff = now >= kickoffTime;
  const canPredict = !isFinished && !isInProgress && !isPastCutoff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (homeScore === '' || awayScore === '') {
      addToast('Ingresa ambos resultados', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(match.id, parseInt(homeScore, 10), parseInt(awayScore, 10));
      addToast('¡Pronóstico guardado exitosamente!', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Error al guardar pronóstico', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col rounded-xl glass-card hover:shadow-md transition-shadow dark:border-white/5 overflow-hidden">
      {/* Main Card Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 gap-3">
        {/* Time & Status */}
        <div className="flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-20 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-white/10 pb-2 sm:pb-0 sm:pr-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {dateFormatter.format(new Date(match.kickoff_time))}
          </span>
          <div className="scale-75 origin-right sm:origin-center mt-1">
            {isInProgress ? (
              <span className="animate-pulse rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                En Juego
              </span>
            ) : isFinished ? (
              <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                Finalizado
              </span>
            ) : (
               <CountdownTimer targetDate={kickoffTime} />
            )}
          </div>
        </div>

        {/* Teams and Score */}
        <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4 w-full">
          <div className="flex flex-1 items-center justify-end gap-2 text-right">
            <span className="text-sm font-bold truncate hidden sm:block">{match.home_team}</span>
            <span className="text-sm font-bold sm:hidden">{match.home_team.substring(0, 3).toUpperCase()}</span>
            <TeamFlag teamName={match.home_team} />
          </div>
          
          {isFinished || isInProgress ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5">
              <span className="text-lg font-black text-slate-800 dark:text-white">
                {isInProgress ? '-' : (match.home_score ?? '-')}
              </span>
              <span className="text-xs font-bold text-slate-400">-</span>
              <span className="text-lg font-black text-slate-800 dark:text-white">
                {isInProgress ? '-' : (match.away_score ?? '-')}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={!canPredict || isSubmitting}
                className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-bold outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white shadow-inner"
              />
              <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={!canPredict || isSubmitting}
                className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-lg font-bold outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white shadow-inner"
              />
              <button type="submit" className="hidden" disabled={!canPredict || isSubmitting}></button>
            </form>
          )}

          <div className="flex flex-1 items-center justify-start gap-2 text-left">
            <TeamFlag teamName={match.away_team} />
            <span className="text-sm font-bold truncate hidden sm:block">{match.away_team}</span>
            <span className="text-sm font-bold sm:hidden">{match.away_team.substring(0, 3).toUpperCase()}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full sm:w-28 flex justify-center sm:justify-end border-t sm:border-t-0 border-slate-200 dark:border-white/10 pt-2 sm:pt-0">
          {isFinished ? (
            prediction ? (
               <div className="flex items-center justify-center gap-1.5 rounded-full bg-accent-teal/10 px-2 py-1 text-xs font-bold text-accent-teal">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
                  {prediction.points} Pts
                </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Sin pronóstico</span>
            )
          ) : !isPastCutoff ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || homeScore === '' || awayScore === ''}
              className="w-full sm:w-auto rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-500 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
            >
              {prediction ? 'Actualizar' : 'Guardar'}
            </button>
          ) : (
            <div className="w-full sm:w-auto rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-2 text-center border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  🔒 Cerrado
                </span>
            </div>
          )}
        </div>
      </div>

      {/* Predictions Dropdown Button */}
      <div className="flex justify-center border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 py-1.5">
        <button
          type="button"
          onClick={() => setShowOthers(!showOthers)}
          className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors py-0.5"
        >
          <span>{showOthers ? 'Ocultar pronósticos' : 'Ver pronósticos de otros'}</span>
          <svg className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showOthers ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* community predictions content */}
      {showOthers && (
        <div className="px-3 pb-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-fifa-dark/30">
          <MatchPredictionsList
            matchId={match.id}
            isFinished={isFinished}
          />
        </div>
      )}
    </div>
  );
}
