import { useState } from 'react';
import type { Match, Prediction } from '../lib/types';
import { MatchCard } from './MatchCard';
import { GroupFilter } from './GroupFilter';
import { TournamentBracket } from './TournamentBracket';

type Tab = 'all' | 'groups' | 'bracket';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos', icon: '📋' },
  { id: 'groups', label: 'Por Grupo', icon: '🏟️' },
  { id: 'bracket', label: 'Fase Final', icon: '🏆' },
];

export function MatchTabs({
  matches,
  predictions,
  onSubmit,
}: {
  matches: Match[];
  predictions: Prediction[];
  onSubmit: (matchId: string, home: number, away: number) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedGroup, setSelectedGroup] = useState('A');

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'all' && (
        <>
          {matches.length === 0 ? (
            <p className="text-slate-500">No hay partidos disponibles.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions.find((p) => p.match_id === match.id)}
                  onSubmit={onSubmit}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'groups' && (
        <GroupFilter
          matches={matches}
          predictions={predictions}
          onSubmit={onSubmit}
          selectedGroup={selectedGroup}
          onGroupChange={setSelectedGroup}
        />
      )}

      {activeTab === 'bracket' && (
        <TournamentBracket
          matches={matches}
          predictions={predictions}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
