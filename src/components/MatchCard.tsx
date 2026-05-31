import { useState } from 'react';
import type { Match, Prediction } from '../lib/types';
import 'flag-icons/css/flag-icons.min.css';
import { getTeamFlagCode } from '../lib/teamFlags';
import { CountdownTimer } from './CountdownTimer';
import { useToast } from '../contexts/ToastContext';
import { MatchPredictionsList } from './MatchPredictionsList';
import { SuccessAnimation } from './SuccessAnimation';

export function TeamFlag({ teamName, className = '' }: { teamName: string; className?: string }) {
  const code = getTeamFlagCode(teamName);
  if (!code) return null;
  return <span className={`fi fi-${code} shrink-0 shadow-sm rounded-[2px] ${className}`} style={{ width: '1.25em', height: '0.9375em' }} />;
}

export function MatchCard({ match, prediction, onSubmit }: { match: Match, prediction?: Prediction, onSubmit: (matchId: string, home: number, away: number) => Promise<void> }) {
  const [homeScore, setHomeScore] = useState<string>(prediction?.home_score?.toString() ?? '');
  const [awayScore, setAwayScore] = useState<string>(prediction?.away_score?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const { addToast } = useToast();

  const isFinished = match.status === 'finished';
  
  // Cutoff is 30 minutes before kickoff
  const kickoffTime = new Date(match.kickoff_time).getTime();
  const cutoffTime = kickoffTime - 30 * 60 * 1000;
  const isPastCutoff = Date.now() >= cutoffTime;
  const canPredict = !isFinished && !isPastCutoff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (homeScore === '' || awayScore === '') {
      addToast('Ingresa ambos resultados', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(match.id, parseInt(homeScore, 10), parseInt(awayScore, 10));
      setShowSuccessOverlay(true);
      setTimeout(() => setShowSuccessOverlay(false), 2000);
      addToast('¡Pronóstico guardado exitosamente!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Error al guardar pronóstico (puede haber pasado el tiempo límite)', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatter = new Intl.DateTimeFormat('es', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex flex-col h-full rounded-2xl glass-card p-5 group hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 dark:hover:shadow-brand-500/5 relative overflow-hidden">
      {showSuccessOverlay && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/95 dark:bg-fifa-card/95 backdrop-blur-[2px] rounded-2xl animate-fade-in">
          <SuccessAnimation />
        </div>
      )}
      {/* Decorative gradient orb for active/hover state */}
      {!isFinished && <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>}
      
      <div className="mb-5 flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          {formatter.format(new Date(match.kickoff_time))}
        </span>
        {isFinished ? (
          <span className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/5">
            Finalizado
          </span>
        ) : (
          <CountdownTimer targetDate={cutoffTime} />
        )}
      </div>

      <div className="mb-6 flex items-center justify-between gap-3 relative z-10">
        <div className="flex flex-1 min-w-0 items-center justify-end gap-3 text-right font-bold text-slate-800 dark:text-white text-lg">
          <span className="truncate">{match.home_team}</span>
          <TeamFlag teamName={match.home_team} className="scale-125" />
        </div>
        <div className="text-xl font-black text-slate-300 dark:text-slate-600 shrink-0 px-2">VS</div>
        <div className="flex flex-1 min-w-0 items-center justify-start gap-3 text-left font-bold text-slate-800 dark:text-white text-lg">
          <TeamFlag teamName={match.away_team} className="scale-125" />
          <span className="truncate">{match.away_team}</span>
        </div>
      </div>

      {isFinished ? (
        <div className="mt-auto rounded-xl bg-slate-50 p-4 text-center dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Resultado Final</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">
            {match.home_score} <span className="text-brand-500">-</span> {match.away_score}
          </p>
          {prediction && (
            <div className="mt-4 border-t border-slate-200/50 pt-4 dark:border-white/5 flex flex-col gap-1">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Tu pronóstico: <span className="font-bold text-slate-900 dark:text-white bg-slate-200/50 dark:bg-white/10 px-2 py-0.5 rounded">{prediction.home_score} - {prediction.away_score}</span>
              </p>
              <div className="mt-2 inline-flex items-center justify-center gap-1.5 self-center rounded-full bg-accent-teal/10 px-3 py-1 text-sm font-bold text-accent-teal">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
                {prediction.points} Puntos
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-4 relative z-10">
          <div className="flex items-center justify-center gap-6">
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={!canPredict || isSubmitting}
              className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50/50 text-center text-2xl font-black outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/20 shadow-inner"
            />
            <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={!canPredict || isSubmitting}
              className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50/50 text-center text-2xl font-black outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-white/10 dark:bg-fifa-dark/50 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/20 shadow-inner"
            />
          </div>
          
          <div className="h-2" />

          {!isPastCutoff && (
            <button
              type="submit"
              disabled={isSubmitting || homeScore === '' || awayScore === ''}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white transition-all hover:bg-brand-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-brand-600 shadow-md shadow-brand-500/20"
            >
              {isSubmitting ? 'Guardando...' : (prediction ? 'Actualizar Pronóstico' : 'Guardar Pronóstico')}
            </button>
          )}
          {isPastCutoff && !isFinished && (
            <div className="rounded-xl bg-slate-100 dark:bg-white/5 py-3 text-center border border-slate-200 dark:border-white/5">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                🔒 Pronósticos cerrados
              </p>
            </div>
          )}
        </form>
      )}

      {(isPastCutoff || isFinished) && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/5 flex flex-col z-10 relative">
          <button
            type="button"
            onClick={() => setShowOthers(!showOthers)}
            className="flex items-center justify-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors py-1 self-center"
          >
            <span>{showOthers ? 'Ocultar pronósticos' : 'Ver pronósticos de otros'}</span>
            <svg className={`w-4 h-4 transform transition-transform duration-200 ${showOthers ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showOthers && (
            <MatchPredictionsList
              matchId={match.id}
              isPastCutoff={isPastCutoff || isFinished}
              isFinished={isFinished}
            />
          )}
        </div>
      )}
    </div>
  );
}
