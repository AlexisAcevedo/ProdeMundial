import type { Match, Prediction } from '../lib/types';
import { MatchCard } from './MatchCard';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function GroupFilter({
  matches,
  predictions,
  onSubmit,
  selectedGroup,
  onGroupChange,
}: {
  matches: Match[];
  predictions: Prediction[];
  onSubmit: (matchId: string, home: number, away: number) => Promise<void>;
  selectedGroup: string;
  onGroupChange: (group: string) => void;
}) {
  const groupMatches = matches.filter(
    (m) => m.stage === 'Group Stage' && m.group_letter === selectedGroup
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => onGroupChange(g)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
              selectedGroup === g
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Grupo {g}
          </button>
        ))}
      </div>

      {groupMatches.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">No hay partidos para el Grupo {selectedGroup}.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groupMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions.find((p) => p.match_id === match.id)}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
