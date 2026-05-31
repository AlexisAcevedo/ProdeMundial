import { useState } from 'react';
import type { Match, Prediction } from '../lib/types';
import { MatchCard } from './MatchCard';
import { GroupFilter } from './GroupFilter';
import { TournamentBracket } from './TournamentBracket';

type Tab = 'all' | 'groups' | 'bracket';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'groups', label: 'Por Grupo', icon: '🏟️' },
  { id: 'all', label: 'Todos', icon: '📋' },
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
  const [activeTab, setActiveTab] = useState<Tab>('groups');
  const [selectedGroup, setSelectedGroup] = useState('A');

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex gap-2 rounded-2xl bg-white/50 p-1.5 shadow-sm backdrop-blur-md dark:bg-fifa-card/50 border border-slate-200/50 dark:border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 overflow-hidden ${
              activeTab === tab.id
                ? 'text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5'
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-brand-600 to-brand-500 z-0"></div>
            )}
            <span className="text-lg relative z-10">{tab.icon}</span>
            <span className="hidden sm:inline relative z-10 tracking-wide">{tab.label}</span>
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
