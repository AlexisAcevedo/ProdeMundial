import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMatches } from '../hooks/useMatches';
import { usePredictions } from '../hooks/usePredictions';
import { useLeagues } from '../hooks/useLeagues';
import type { Match, Prediction } from '../lib/types';

function MatchCard({ match, prediction, onSubmit }: { match: Match, prediction?: Prediction, onSubmit: (matchId: string, home: number, away: number) => Promise<void> }) {
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{formatter.format(new Date(match.kickoff_time))}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${isFinished ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
          {isFinished ? 'Finalizado' : 'Próximo'}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1 text-right font-semibold text-slate-800 dark:text-slate-100">{match.home_team}</div>
        <div className="text-xl font-bold text-slate-300 dark:text-slate-600">vs</div>
        <div className="flex-1 font-semibold text-slate-800 dark:text-slate-100">{match.away_team}</div>
      </div>

      {isFinished ? (
        <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900/50">
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { matches, isLoading: loadingMatches } = useMatches();
  const { predictions, submitPrediction, isLoading: loadingPredictions } = usePredictions();
  const { leagues, joinLeague, isLoading: loadingLeagues } = useLeagues();
  
  const [inviteCode, setInviteCode] = useState('');
  const [leagueError, setLeagueError] = useState('');

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    
    setLeagueError('');
    try {
      await joinLeague(inviteCode);
      setInviteCode('');
    } catch (err: any) {
      setLeagueError(err.message);
    }
  };

  const isLoading = loadingMatches || loadingPredictions || loadingLeagues;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-500">ProdeMundial</h1>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm sm:inline">{user?.email}</span>
            <button 
              onClick={signOut}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 md:py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="mb-6 text-2xl font-bold">Partidos</h2>
            {matches.length === 0 ? (
              <p className="text-slate-500">No hay partidos disponibles.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictions.find((p) => p.match_id === match.id)}
                    onSubmit={submitPrediction}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-bold">Mis Ligas</h2>
              {leagues.length === 0 ? (
                <p className="mb-4 text-sm text-slate-500">No estás en ninguna liga.</p>
              ) : (
                <ul className="mb-4 space-y-2">
                  {leagues.map((league) => (
                    <li key={league.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900/50">
                      <span className="font-medium">{league.name}</span>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleJoinLeague} className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                <label className="mb-2 block text-sm font-medium">Unirse con código</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ej. ABC123"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!inviteCode}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    Unirse
                  </button>
                </div>
                {leagueError && <p className="mt-2 text-xs text-red-500">{leagueError}</p>}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
