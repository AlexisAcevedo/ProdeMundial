import { useState } from 'react';
import type { Match, Prediction } from '../lib/types';
import { BracketMatchCard } from './TournamentBracket';

const R32_NUMBERS = [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87];
const R16_NUMBERS = [89, 90, 93, 94, 91, 92, 95, 96];
const QF_NUMBERS = [97, 98, 99, 100];
const SF_NUMBERS = [101, 102];
const FINAL_NUMBERS = [104, 103]; // Final y 3er Puesto

type RoundTab = 'r32' | 'r16' | 'qf' | 'sf' | 'final';

export function MobileBracket({
  matches,
  predictions,
  onSubmit,
}: {
  matches: Match[];
  predictions: Prediction[];
  onSubmit: (matchId: string, home: number, away: number) => Promise<void>;
}) {
  const [activeRound, setActiveRound] = useState<RoundTab>('r16'); // Por defecto Octavos que es más común, o r32 si tiene partidos

  const rounds: { id: RoundTab; label: string; matchNumbers: number[] }[] = [
    { id: 'r32', label: '16avos de final', matchNumbers: R32_NUMBERS },
    { id: 'r16', label: 'Octavos', matchNumbers: R16_NUMBERS },
    { id: 'qf', label: 'Cuartos', matchNumbers: QF_NUMBERS },
    { id: 'sf', label: 'Semis', matchNumbers: SF_NUMBERS },
    { id: 'final', label: 'Finales', matchNumbers: FINAL_NUMBERS },
  ];

  // Obtener los partidos de la ronda activa
  const currentRound = rounds.find((r) => r.id === activeRound);
  const roundMatches = currentRound
    ? currentRound.matchNumbers
        .map((num) => matches.find((m) => m.match_number === num))
        .filter(Boolean) as Match[]
    : [];

  return (
    <div className="space-y-4">
      {/* Selector de rondas en modo móvil */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none snap-x">
        {rounds.map((round) => {
          const isActive = activeRound === round.id;
          return (
            <button
              key={round.id}
              onClick={() => setActiveRound(round.id)}
              className={`snap-center rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/10'
                  : 'bg-white text-slate-500 hover:text-slate-700 dark:bg-fifa-card dark:text-slate-400 dark:hover:text-slate-200 border-slate-200/50 dark:border-white/5'
              }`}
            >
              {round.label}
            </button>
          );
        })}
      </div>

      {/* Lista vertical de partidos de la ronda */}
      {roundMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-xs text-slate-400 dark:border-white/5 dark:bg-fifa-card/50">
          No hay partidos programados para esta ronda.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {roundMatches.map((match) => (
            <div key={match.id} className="relative">
              {/* Etiqueta distintiva si es Final o 3er Puesto */}
              {match.match_number === 104 && (
                <div className="absolute top-2 right-2 z-20 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-500 border border-amber-500/20">
                  Gran Final
                </div>
              )}
              {match.match_number === 103 && (
                <div className="absolute top-2 right-2 z-20 rounded bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-500/20">
                  3er Puesto
                </div>
              )}
              <BracketMatchCard
                match={match}
                prediction={predictions.find((p) => p.match_id === match.id)}
                onSubmit={onSubmit}
                compact={activeRound === 'r32'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
