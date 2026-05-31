import { useState } from 'react';
import type { Match, Prediction } from '../lib/types';
import { GroupFilter } from './GroupFilter';
import { TournamentBracket } from './TournamentBracket';
import { GlobalStandings } from './GlobalStandings';
import { PendingBadge } from './PendingBadge';
import { usePendingPredictions } from '../hooks/usePendingPredictions';
import { PredictionHistory } from './PredictionHistory';
import { BulkPredictionView } from './BulkPredictionView';
import { MobileBracket } from './MobileBracket';

type Tab = 'groups' | 'bracket' | 'ranking' | 'history' | 'bulk';

export function MatchTabs({
  matches,
  predictions,
  onSubmit,
  onSubmitBulk,
  activeTab: controlledActiveTab,
  setActiveTab: controlledSetActiveTab,
}: {
  matches: Match[];
  predictions: Prediction[];
  onSubmit: (matchId: string, home: number, away: number) => Promise<void>;
  onSubmitBulk: (items: { matchId: string; homeScore: number; awayScore: number }[]) => Promise<unknown>;
  activeTab?: Tab;
  setActiveTab?: (tab: Tab) => void;
}) {
  const [localActiveTab, localSetActiveTab] = useState<Tab>('groups');
  const activeTab = controlledActiveTab ?? localActiveTab;
  const setActiveTab = controlledSetActiveTab ?? localSetActiveTab;
  const [selectedGroup, setSelectedGroup] = useState('A');

  const { pendingCount } = usePendingPredictions(matches, predictions);

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'groups', label: 'Grupos', icon: '🏟️' },
    { id: 'bracket', label: 'Fase Final', icon: '🏆' },
    { id: 'bulk', label: 'Carga Rápida', icon: '📥', badge: pendingCount },
    { id: 'history', label: 'Historial', icon: '📜' },
    { id: 'ranking', label: 'Ranking', icon: '🏅' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex gap-2 rounded-2xl bg-white/50 p-1.5 shadow-sm backdrop-blur-md dark:bg-fifa-card/50 border border-slate-200/50 dark:border-white/5 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 overflow-hidden min-w-[100px] ${
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
            {tab.badge !== undefined && tab.badge > 0 && (
              <div className="relative z-10">
                <PendingBadge count={tab.badge} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}

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
        <>
          <div className="block md:hidden">
            <MobileBracket
              matches={matches}
              predictions={predictions}
              onSubmit={onSubmit}
            />
          </div>
          <div className="hidden md:block">
            <TournamentBracket
              matches={matches}
              predictions={predictions}
              onSubmit={onSubmit}
            />
          </div>
        </>
      )}

      {activeTab === 'ranking' && (
        <GlobalStandings />
      )}

      {activeTab === 'history' && (
        <PredictionHistory matches={matches} predictions={predictions} />
      )}

      {activeTab === 'bulk' && (
        <BulkPredictionView
          matches={matches}
          predictions={predictions}
          onSubmitBulk={onSubmitBulk}
        />
      )}
    </div>
  );
}
