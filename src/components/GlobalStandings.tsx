import { useGlobalStandings } from '../hooks/useGlobalStandings';

export function GlobalStandings() {
  const { standings, isLoading, error, userPosition } = useGlobalStandings();

  if (isLoading) {
    return (
      <div key="loading" className="flex h-64 items-center justify-center rounded-2xl border border-slate-200/50 bg-white/50 dark:border-white/5 dark:bg-white/5 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando ranking global...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div key="error" className="rounded-2xl border border-red-200/50 bg-red-50/10 p-6 text-center text-red-500 dark:border-red-900/30">
        Error al cargar ranking global: {error.message}
      </div>
    );
  }

  const totalParticipants = standings.length;

  return (
    <div key="content" className="space-y-6">
      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[100px] z-10 border border-slate-200/50 dark:border-white/5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participantes Totales</span>
          <span className="text-3xl font-black text-slate-900 dark:text-white mt-2">{totalParticipants}</span>
        </div>
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[100px] z-10 border border-slate-200/50 dark:border-white/5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tu Posición Global</span>
          <span className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2">
            {userPosition ? `#${userPosition}` : 'Sin posición'}
          </span>
        </div>
      </div>

      <div className="glass-card rounded-2xl relative z-10 overflow-hidden border border-slate-200/50 dark:border-white/5">
        <div className="p-6 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
            </svg>
            Ranking Global
          </h3>
        </div>

        {standings.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">No hay participantes aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-black/20 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4">Participante</th>
                  <th className="px-6 py-4 text-center">🎯 Exactos</th>
                  <th className="px-6 py-4 text-center">✅ Aciertos</th>
                  <th className="px-6 py-4 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {standings.map((participant, index) => {
                  const isCurrentUser = userPosition === index + 1;
                  return (
                    <tr 
                      key={participant.user_id} 
                      className={`group hover:bg-white/50 dark:hover:bg-white/5 transition-colors ${
                        isCurrentUser ? 'bg-brand-500/10 dark:bg-brand-500/5 font-medium border-l-4 border-l-brand-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm ${
                          index === 0 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                            : index === 1 
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
                            : index === 2 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
                            : 'bg-transparent text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {participant.avatar_url ? (
                            <img src={participant.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-white/10" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-teal/20 text-brand-600 dark:text-brand-400 font-bold shadow-inner border border-white/20 dark:border-white/5">
                              {participant.name ? participant.name.charAt(0).toUpperCase() : participant.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className={`font-bold text-slate-900 dark:text-white transition-colors ${isCurrentUser ? 'text-brand-600 dark:text-brand-400' : 'group-hover:text-brand-600 dark:group-hover:text-brand-400'}`}>
                              {participant.name || participant.email.split('@')[0]}
                              {isCurrentUser && <span className="ml-2 text-xs bg-brand-500 text-white px-1.5 py-0.5 rounded font-bold">Tú</span>}
                            </div>
                            {participant.name && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">{participant.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {participant.exact_count}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {participant.correct_count}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-block text-xl font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-lg">
                          {participant.total_points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
