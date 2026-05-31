import { useState } from 'react';
import type { Match, Prediction } from '../lib/types';
import 'flag-icons/css/flag-icons.min.css';
import { getTeamFlagCode } from '../lib/teamFlags';

export function TeamFlag({ teamName, className = '' }: { teamName: string; className?: string }) {
  const code = getTeamFlagCode(teamName);
  if (!code) return null;
  return <span className={`fi fi-${code} shrink-0 shadow-sm rounded-[2px] ${className}`} style={{ width: '1.25em', height: '0.9375em' }} />;
}

export function MatchCard({ match, prediction, onSubmit }: { match: Match, prediction?: Prediction, onSubmit: (matchId: string, home: number, away: number) => Promise<void> }) {
  const [homeScore, setHomeScore] = useState<string>(prediction?.home_score?.toString() ?? '');
  const [awayScore, setAwayScore] = useState<string>(prediction?.away_score?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isFinished = match.status === 'finished';
  
  // Cutoff is 30 minutes before kickoff
  const kickoffTime = new Date(match.kickoff_time).getTime();
  const cutoffTime = kickoffTime - 30 * 60 * 1000;
  const isPastCutoff = Date.now() >= cutoffTime;
  const canPredict = !isFinished && !isPastCutoff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (homeScore === '' || awayScore === '') {
      setError('Ingresa ambos resultados');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(match.id, parseInt(homeScore, 10), parseInt(awayScore, 10));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar pronóstico (puede haber pasado el tiempo límite)');
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
    <div className="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{formatter.format(new Date(match.kickoff_time))}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${isFinished ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
          {isFinished ? 'Finalizado' : 'Próximo'}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex flex-1 min-w-0 items-center justify-end gap-2 text-right font-semibold text-slate-800 dark:text-slate-100">
          <span className="truncate">{match.home_team}</span>
          <TeamFlag teamName={match.home_team} />
        </div>
        <div className="text-xl font-bold text-slate-300 dark:text-slate-600 shrink-0">vs</div>
        <div className="flex flex-1 min-w-0 items-center justify-start gap-2 text-left font-semibold text-slate-800 dark:text-slate-100">
          <TeamFlag teamName={match.away_team} />
          <span className="truncate">{match.away_team}</span>
        </div>
      </div>

      {isFinished ? (
        <div className="mt-auto rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900/50">
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Resultado Final</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {match.home_score} - {match.away_score}
          </p>
          {prediction && (
            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
              <p className="text-sm">
                Tu pronóstico: <span className="font-bold">{prediction.home_score} - {prediction.away_score}</span>
              </p>
              <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Puntos: {prediction.points}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-auto flex flex-col gap-3">
          <div className="flex items-center justify-center gap-4">
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={!canPredict || isSubmitting}
              className="w-16 rounded-lg border border-slate-300 bg-slate-50 p-2 text-center text-lg font-bold outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={!canPredict || isSubmitting}
              className="w-16 rounded-lg border border-slate-300 bg-slate-50 p-2 text-center text-lg font-bold outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
          </div>
          
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          {success && <p className="text-center text-sm text-emerald-500">¡Guardado!</p>}
          {!isPastCutoff && (
            <button
              type="submit"
              disabled={isSubmitting || homeScore === '' || awayScore === ''}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 dark:bg-blue-600 dark:hover:bg-blue-500 dark:disabled:bg-slate-700"
            >
              {isSubmitting ? 'Guardando...' : (prediction ? 'Actualizar' : 'Guardar')}
            </button>
          )}
          {isPastCutoff && !isFinished && (
            <p className="text-center text-sm text-slate-500">
              Cierre de pronósticos finalizado.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
