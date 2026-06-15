import { useMatchLeaguePredictions } from '../hooks/useMatchLeaguePredictions';
import { useAuth } from '../hooks/useAuth';
import type { Match } from '../lib/types';

interface MatchPredictionsModalProps {
  leagueId: string;
  leagueName: string;
  match: Match;
  onClose: () => void;
}

export function MatchPredictionsModal({ leagueId, leagueName, match, onClose }: MatchPredictionsModalProps) {
  const { predictions, isLoading, error } = useMatchLeaguePredictions(leagueId, match.id);
  const { user } = useAuth();

  const isFinished = match.status === 'finished';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Pronósticos de la Liga</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Liga: {leagueName}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Match Info Banner */}
          <div className="mt-4 flex items-center justify-center gap-4 bg-white dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-2xl py-3 px-4 shadow-inner">
            <span className="font-bold text-slate-800 dark:text-slate-200">{match.home_team}</span>
            <span className="font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded text-sm">
              {isFinished ? `${match.home_score} - ${match.away_score}` : 'VS'}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{match.away_team}</span>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[350px] overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <svg className="animate-spin h-8 w-8 text-brand-500 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Obteniendo pronósticos...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">Error: {error.message}</div>
          ) : predictions.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">No hay participantes.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {predictions.map((p) => {
                const isMe = p.user_id === user?.id;
                
                // Determinar el estado visual del pronóstico
                let predText: string;
                let badgeStyle: string;
                let pointsBadge = null;

                if (p.prediction) {
                  predText = `${p.prediction.home_score} - ${p.prediction.away_score}`;
                  badgeStyle = 'bg-brand-50 text-brand-700 dark:bg-brand-900/25 dark:text-brand-400 font-extrabold text-base';

                  if (isFinished && p.prediction.points !== null) {
                    if (p.prediction.points === 3) {
                      pointsBadge = <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/40">+3 Pleno</span>;
                    } else if (p.prediction.points === 1) {
                      pointsBadge = <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">+1 Acierto</span>;
                    } else {
                      pointsBadge = <span className="text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40">0 pts</span>;
                    }
                  }
                } else {
                  predText = 'Sin prode';
                  badgeStyle = 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500 font-medium text-xs';
                }

                return (
                  <div key={p.user_id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-teal/10 text-brand-600 dark:text-brand-400 font-bold border border-white/20 dark:border-white/5">
                        {p.display_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                          {p.display_name || 'Usuario'}
                          {isMe && <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.2 rounded font-normal text-slate-500 dark:text-slate-400">Vos</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pointsBadge}
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl min-w-[70px] text-center ${badgeStyle}`}>
                        {predText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
