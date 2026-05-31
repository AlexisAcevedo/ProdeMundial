import { useLeagueStandings } from '../hooks/useLeagueStandings';
import type { League } from '../lib/types';
import { ShareLeague } from './ShareLeague';

interface LeagueDetailsProps {
  league: League;
  onBack: () => void;
}

export function LeagueDetails({ league, onBack }: LeagueDetailsProps) {
  const { standings, isLoading, error } = useLeagueStandings(league.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 relative z-10">
        <button
          onClick={onBack}
          className="rounded-xl p-2.5 bg-white/50 dark:bg-white/5 text-slate-500 hover:bg-white hover:text-brand-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white transition-all backdrop-blur-sm border border-slate-200/50 dark:border-white/5 shadow-sm"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{league.name}</h2>
          <div className="flex flex-col gap-2 mt-1">
            <div className="self-start inline-flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
              Código de invitación: <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm tracking-wider">{league.invite_code}</span>
            </div>
            <ShareLeague inviteCode={league.invite_code} leagueName={league.name} />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl relative z-10 overflow-hidden">
        <div className="p-6 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Tabla de Posiciones
          </h3>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Cargando posiciones...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Error al cargar posiciones: {error.message}</div>
        ) : standings.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">No hay participantes aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-black/20 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4">Participante</th>
                  <th className="px-6 py-4 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {standings.map((participant, index) => (
                  <tr key={participant.user_id} className="group hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : index === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-transparent text-slate-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-teal/20 text-brand-600 dark:text-brand-400 font-bold shadow-inner border border-white/20 dark:border-white/5">
                          {participant.name ? participant.name.charAt(0).toUpperCase() : participant.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                            {participant.name || participant.email.split('@')[0]}
                          </div>
                          {participant.name && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">{participant.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block text-xl font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-lg">
                        {participant.total_points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
