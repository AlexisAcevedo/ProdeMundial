import type { Match, Prediction } from '../lib/types';
import { MatchCard } from './MatchCard';

interface TodaysMatchesProps {
  matches: Match[];
  predictions: Prediction[];
  onSubmit: (matchId: string, home: number, away: number) => Promise<void>;
}

export function TodaysMatches({ matches, predictions, onSubmit }: TodaysMatchesProps) {
  const today = new Date().toDateString();
  const todaysMatches = matches.filter(
    (match) => new Date(match.kickoff_time).toDateString() === today
  );

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Partidos de Hoy
      </h3>
      
      {todaysMatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-white/5 dark:bg-fifa-card/50">
          <span className="text-2xl mb-2 block">🏟️</span>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Hoy no hay partidos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {todaysMatches.map((match) => {
            const prediction = predictions.find((p) => p.match_id === match.id);
            return (
              <MatchCard
                key={match.id}
                match={match}
                prediction={prediction}
                onSubmit={onSubmit}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
