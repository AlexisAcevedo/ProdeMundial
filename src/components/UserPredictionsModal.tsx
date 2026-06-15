import { useState } from 'react';
import { useUserPredictions } from '../hooks/useUserPredictions';
import { TeamFlag } from './MatchCard';

interface UserPredictionsModalProps {
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function UserPredictionsModal({
  userId,
  userName,
  userAvatarUrl,
  onClose,
}: UserPredictionsModalProps) {
  const { predictions, isLoading, error } = useUserPredictions(userId);
  const [activeTab, setActiveTab] = useState<'history' | 'upcoming'>('history');

  // Filter predictions
  const historyPredictions = predictions.filter(p => p.match.status === 'finished');
  const upcomingPredictions = predictions.filter(p => p.match.status !== 'finished');

  // Stats calculation
  const totalPoints = historyPredictions.reduce((acc, curr) => acc + (curr.points ?? 0), 0);
  const exacts = historyPredictions.filter(p => p.points === 3).length;
  const winners = historyPredictions.filter(p => p.points === 1).length;
  const craps = historyPredictions.filter(p => p.points === 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-fifa-card border border-slate-200/50 dark:border-white/5 z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="h-12 w-12 rounded-2xl object-cover border-2 border-brand-500/20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 text-lg font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {userName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pronósticos de la comunidad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading / Error / Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-3"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cargando pronósticos de {userName}...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-red-500">
            Ocurrió un error al cargar los pronósticos.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1 scrollbar-thin">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-brand-500/5 dark:bg-brand-500/10 p-3 rounded-2xl border border-brand-500/10 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Puntos</span>
                <span className="text-xl font-black text-brand-700 dark:text-brand-300">{totalPoints}</span>
              </div>
              <div className="bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-2xl border border-amber-500/10 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Exactos</span>
                <span className="text-xl font-black text-amber-700 dark:text-amber-300">{exacts}</span>
              </div>
              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ganador</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{winners}</span>
              </div>
              <div className="bg-slate-500/5 dark:bg-slate-500/10 p-3 rounded-2xl border border-slate-500/10 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Crapero</span>
                <span className="text-xl font-black text-slate-700 dark:text-slate-300">{craps}</span>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-100 dark:border-white/5 p-0.5 bg-slate-50 dark:bg-white/5 rounded-xl">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-brand-600 dark:bg-fifa-dark dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Historial ({historyPredictions.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-brand-600 dark:bg-fifa-dark dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Próximos ({upcomingPredictions.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-2.5">
              {activeTab === 'history' ? (
                historyPredictions.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                    No hay pronósticos finalizados para este usuario.
                  </p>
                ) : (
                  historyPredictions.map((pred) => (
                    <div
                      key={pred.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5"
                    >
                      {/* Match Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TeamFlag teamName={pred.match.home_team} />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[120px]">
                            {pred.match.home_team}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">vs</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TeamFlag teamName={pred.match.away_team} />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[120px]">
                            {pred.match.away_team}
                          </span>
                        </div>
                      </div>

                      {/* Prediction and Result */}
                      <div className="flex items-center gap-3 shrink-0 pl-2">
                        {/* Real Result */}
                        <div className="text-[10px] text-slate-400 font-medium text-right leading-tight">
                          Resultado
                          <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                            {pred.match.home_score} - {pred.match.away_score}
                          </span>
                        </div>

                        {/* Prediction */}
                        <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium text-right leading-tight">
                          Pronóstico
                          <span className="block text-xs font-black text-slate-800 dark:text-slate-100 bg-slate-200/50 dark:bg-white/10 px-1.5 py-0.5 rounded text-center">
                            {pred.home_score} - {pred.away_score}
                          </span>
                        </div>

                        {/* Points badge */}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg text-center min-w-[55px] ${
                          pred.points === 3
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50'
                            : pred.points === 1
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50'
                            : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200/50'
                        }`}>
                          +{pred.points} pts
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                upcomingPredictions.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                    No hay pronósticos futuros registrados para este usuario.
                  </p>
                ) : (
                  upcomingPredictions.map((pred) => (
                    <div
                      key={pred.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5"
                    >
                      {/* Match Info */}
                      <div className="flex flex-col min-w-0 flex-1 gap-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TeamFlag teamName={pred.match.home_team} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[120px]">
                              {pred.match.home_team}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">vs</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TeamFlag teamName={pred.match.away_team} />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px] sm:max-w-[120px]">
                              {pred.match.away_team}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {dateFormatter.format(new Date(pred.match.kickoff_time))}
                        </span>
                      </div>

                      {/* Prediction */}
                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium text-right leading-tight mr-1">
                          Pronóstico
                          <span className="block text-sm font-black text-slate-800 dark:text-slate-100 bg-brand-500/10 px-2.5 py-0.5 rounded text-center mt-0.5">
                            {pred.home_score} - {pred.away_score}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-100 dark:bg-white/5 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
