import { useMatchPredictions } from '../hooks/useMatchPredictions';
import { useAuth } from '../hooks/useAuth';

interface MatchPredictionsListProps {
  matchId: string;
  isPastCutoff: boolean;
  isFinished: boolean;
}

export function MatchPredictionsList({ matchId, isPastCutoff, isFinished }: MatchPredictionsListProps) {
  const { predictions, isLoading, error } = useMatchPredictions(matchId, isPastCutoff);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent mr-2"></div>
        Cargando pronósticos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-2 text-center text-xs text-red-500">
        Error al cargar pronósticos de otros usuarios.
      </div>
    );
  }

  // Filtrar para no mostrar el pronóstico del usuario actual
  const otherPredictions = predictions.filter((p) => p.user_id !== user?.id);

  if (otherPredictions.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Nadie más ha pronosticado este partido aún.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/5 space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Pronósticos de la Comunidad
      </h4>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {otherPredictions.map((pred) => {
          const profile = pred.users;
          const displayName = profile?.display_name || 'Usuario';
          const avatarUrl = profile?.avatar_url;

          return (
            <div
              key={pred.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-7 w-7 rounded-lg object-cover border border-slate-200 dark:border-white/10"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 bg-slate-200/50 dark:bg-white/10 px-2 py-0.5 rounded">
                  {pred.home_score} - {pred.away_score}
                </span>
                {isFinished && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    pred.points === 3
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                      : pred.points === 1
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'
                  }`}>
                    {pred.points} pts
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
