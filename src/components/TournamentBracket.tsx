import { useState } from 'react';
import type { Match, Prediction } from '../lib/types';
import { TeamFlag } from './MatchCard';

const LEFT_R32 = [73, 75, 74, 77, 83, 84, 81, 82];
const LEFT_R16 = [89, 90, 93, 94];
const LEFT_QF = [97, 98];
const LEFT_SF = [101];

const RIGHT_SF = [102];
const RIGHT_QF = [99, 100];
const RIGHT_R16 = [91, 92, 95, 96];
const RIGHT_R32 = [76, 78, 79, 80, 86, 88, 85, 87];

function BracketMatchCard({
  match,
  prediction,
  onSubmit,
  compact = false,
}: {
  match: Match;
  prediction?: Prediction;
  onSubmit: (matchId: string, home: number, away: number) => Promise<void>;
  compact?: boolean;
}) {
  const [homeScore, setHomeScore] = useState<string>(prediction?.home_score?.toString() ?? '');
  const [awayScore, setAwayScore] = useState<string>(prediction?.away_score?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isFinished = match.status === 'finished';
  const kickoffTime = new Date(match.kickoff_time).getTime();
  const cutoffTime = kickoffTime - 30 * 60 * 1000;
  const isPastCutoff = Date.now() >= cutoffTime;
  const canPredict = !isFinished && !isPastCutoff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (homeScore === '' || awayScore === '') {
      setError('Ambos resultados');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(match.id, parseInt(homeScore, 10), parseInt(awayScore, 10));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateStr = new Intl.DateTimeFormat('es', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(match.kickoff_time));

  return (
    <div
      className={`bracket-match rounded-xl border bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] dark:bg-slate-800/80 ${
        isFinished
          ? 'border-slate-200 dark:border-slate-700'
          : 'border-blue-200 dark:border-blue-800/60 shadow-[0_0_12px_rgba(59,130,246,0.02)]'
      } ${compact ? 'p-2.5' : 'p-3.5'}`}
    >
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {dateStr}
      </p>

      {/* Teams */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <TeamFlag teamName={match.home_team} />
            <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
              {match.home_team}
            </span>
          </div>
          {isFinished ? (
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {match.home_score}
            </span>
          ) : canPredict ? (
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={isSubmitting}
              className="w-10 rounded-md border border-slate-300 bg-slate-50/50 px-1 py-0.5 text-center text-xs font-bold outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100 dark:focus:border-blue-400"
            />
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <TeamFlag teamName={match.away_team} />
            <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
              {match.away_team}
            </span>
          </div>
          {isFinished ? (
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {match.away_score}
            </span>
          ) : canPredict ? (
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={isSubmitting}
              className="w-10 rounded-md border border-slate-300 bg-slate-50/50 px-1 py-0.5 text-center text-xs font-bold outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100 dark:focus:border-blue-400"
            />
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      </div>

      {/* Predict button / status */}
      {canPredict && (
        <form onSubmit={handleSubmit} className="mt-2.5">
          <button
            type="submit"
            disabled={isSubmitting || homeScore === '' || awayScore === ''}
            className="w-full rounded-md bg-blue-600 px-2 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
          >
            {isSubmitting ? '...' : prediction ? 'Actualizar' : 'Guardar'}
          </button>
          {error && <p className="mt-1 text-[9px] text-center text-red-500 font-medium">{error}</p>}
          {success && <p className="mt-1 text-[9px] text-center text-emerald-500 font-medium font-semibold">✓</p>}
        </form>
      )}

      {prediction && isFinished && (
        <div className="mt-2 border-t border-slate-100 pt-1.5 dark:border-slate-700/60">
          <p className="text-[9px] text-slate-500 dark:text-slate-400 text-center">
            Pronóstico: <span className="font-bold">{prediction.home_score}-{prediction.away_score}</span>{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">
              ({prediction.points} pts)
            </span>
          </p>
        </div>
      )}

      {isPastCutoff && !isFinished && !canPredict && (
        <p className="mt-2 text-[9px] text-slate-400 dark:text-slate-500 text-center font-medium">Cerrado</p>
      )}
    </div>
  );
}

export function TournamentBracket({
  matches,
  predictions,
  onSubmit,
}: {
  matches: Match[];
  predictions: Prediction[];
  onSubmit: (matchId: string, home: number, away: number) => Promise<void>;
}) {
  // Mapeamos las columnas del lado izquierdo
  const leftColumns = [
    {
      stage: 'Round of 32',
      label: '32avos',
      matches: LEFT_R32.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
    {
      stage: 'Round of 16',
      label: 'Octavos',
      matches: LEFT_R16.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
    {
      stage: 'Quarterfinals',
      label: 'Cuartos',
      matches: LEFT_QF.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
    {
      stage: 'Semifinals',
      label: 'Semis',
      matches: LEFT_SF.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
  ];

  // Mapeamos las columnas del lado derecho (SF -> QF -> R16 -> R32 para el flujo de izquierda a derecha)
  const rightColumns = [
    {
      stage: 'Semifinals',
      label: 'Semis',
      matches: RIGHT_SF.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
    {
      stage: 'Quarterfinals',
      label: 'Cuartos',
      matches: RIGHT_QF.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
    {
      stage: 'Round of 16',
      label: 'Octavos',
      matches: RIGHT_R16.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
    {
      stage: 'Round of 32',
      label: '32avos',
      matches: RIGHT_R32.map((num) => matches.find((m) => m.match_number === num)).filter(Boolean) as Match[],
    },
  ];

  // Partidos del centro
  const finalMatch = matches.find((m) => m.match_number === 104);
  const thirdPlaceMatch = matches.find((m) => m.match_number === 103);

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      <div className="flex w-max min-w-[1300px] mx-auto items-stretch gap-4 px-2 py-4">
        
        {/* LADO IZQUIERDO */}
        {leftColumns.map((col, colIdx) => (
          <div
            key={col.stage + '-left'}
            className="flex flex-col flex-1 min-w-[150px] max-w-[170px]"
          >
            {/* Stage Header */}
            <div className="mb-4 text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {col.label}
              </h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                {col.matches.length} {col.matches.length === 1 ? 'partido' : 'partidos'}
              </p>
            </div>

            {/* Match List */}
            <div className="flex flex-1 flex-col justify-around gap-2">
              {col.matches.map((match) => (
                <div key={match.id} className="bracket-match-wrapper relative py-1">
                  <BracketMatchCard
                    match={match}
                    prediction={predictions.find((p) => p.match_id === match.id)}
                    onSubmit={onSubmit}
                    compact={col.stage === 'Round of 32'}
                  />
                  {/* Connector Line to the Right */}
                  {colIdx < 3 ? (
                    <div className="absolute right-0 top-1/2 hidden h-px w-4 -translate-y-1/2 translate-x-full bg-slate-300 dark:bg-slate-700 lg:block">
                      <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    </div>
                  ) : (
                    // Left Semifinal to Center (Final)
                    <div className="absolute right-0 top-1/2 hidden h-px w-6 -translate-y-1/2 translate-x-full bg-gradient-to-r from-blue-500 to-amber-500 lg:block">
                      <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* COLUMNA CENTRAL (FINAL & 3ER PUESTO) */}
        <div className="flex flex-col justify-center items-center gap-6 min-w-[200px] max-w-[230px] px-2 self-center">
          
          {/* Trophy Header */}
          <div className="text-center">
            <span className="text-4xl filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)] block">🏆</span>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400 mt-2">
              Gran Final
            </h3>
          </div>

          {/* Final Card */}
          <div className="w-full relative">
            {finalMatch ? (
              <BracketMatchCard
                match={finalMatch}
                prediction={predictions.find((p) => p.match_id === finalMatch.id)}
                onSubmit={onSubmit}
                compact={false}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-6 text-center text-xs text-slate-400">
                Final Pendiente
              </div>
            )}
          </div>

          {/* Third Place */}
          <div className="w-full border-t border-slate-200/60 dark:border-slate-700 pt-6">
            <h4 className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Tercer Puesto
            </h4>
            {thirdPlaceMatch ? (
              <BracketMatchCard
                match={thirdPlaceMatch}
                prediction={predictions.find((p) => p.match_id === thirdPlaceMatch.id)}
                onSubmit={onSubmit}
                compact={true}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 p-4 text-center text-xs text-slate-400">
                3er Puesto Pendiente
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO */}
        {rightColumns.map((col, colIdx) => (
          <div
            key={col.stage + '-right'}
            className="flex flex-col flex-1 min-w-[150px] max-w-[170px]"
          >
            {/* Stage Header */}
            <div className="mb-4 text-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {col.label}
              </h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                {col.matches.length} {col.matches.length === 1 ? 'partido' : 'partidos'}
              </p>
            </div>

            {/* Match List */}
            <div className="flex flex-1 flex-col justify-around gap-2">
              {col.matches.map((match) => (
                <div key={match.id} className="bracket-match-wrapper relative py-1">
                  <BracketMatchCard
                    match={match}
                    prediction={predictions.find((p) => p.match_id === match.id)}
                    onSubmit={onSubmit}
                    compact={col.stage === 'Round of 32'}
                  />
                  {/* Connector Line to the Left */}
                  {colIdx > 0 ? (
                    <div className="absolute left-0 top-1/2 hidden h-px w-4 -translate-y-1/2 -translate-x-full bg-slate-300 dark:bg-slate-700 lg:block">
                      <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    </div>
                  ) : (
                    // Right Semifinal to Center (Final)
                    <div className="absolute left-0 top-1/2 hidden h-px w-6 -translate-y-1/2 -translate-x-full bg-gradient-to-l from-blue-500 to-amber-500 lg:block">
                      <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
