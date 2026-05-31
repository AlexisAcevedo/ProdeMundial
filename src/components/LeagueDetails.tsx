import { useLeagueStandings } from '../hooks/useLeagueStandings';
import type { League } from '../lib/types';

interface LeagueDetailsProps {
  league: League;
  onBack: () => void;
}

export function LeagueDetails({ league, onBack }: LeagueDetailsProps) {
  const { standings, isLoading, error } = useLeagueStandings(league.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold">{league.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Código de invitación: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{league.invite_code}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold">Tabla de Posiciones</h3>
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
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Pos</th>
                  <th className="px-6 py-4 font-medium">Participante</th>
                  <th className="px-6 py-4 font-medium text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {standings.map((participant, index) => (
                  <tr key={participant.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                      {index + 1}°
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {participant.name ? participant.name.charAt(0).toUpperCase() : participant.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {participant.name || participant.email.split('@')[0]}
                          </div>
                          {participant.name && (
                            <div className="text-xs text-slate-500">{participant.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-emerald-600 dark:text-emerald-500">
                      {participant.total_points}
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
