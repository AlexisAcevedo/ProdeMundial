import { useStandings } from '../hooks/useStandings';
import { TeamFlag } from './MatchCard';

export function StandingsTable({ groupLetter }: { groupLetter: string }) {
  const { standings, isLoading } = useStandings(groupLetter);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <span className="text-sm text-slate-500">Cargando posiciones...</span>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aún no hay posiciones para el Grupo {groupLetter}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Se cargarán en la primera sincronización con la API.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">
          Posiciones - Grupo {groupLetter}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-3 py-3 text-center">Pts</th>
              <th className="px-3 py-3 text-center">PJ</th>
              <th className="px-3 py-3 text-center">G</th>
              <th className="px-3 py-3 text-center">E</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">GF</th>
              <th className="px-3 py-3 text-center">GC</th>
              <th className="px-3 py-3 text-center">DIF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {standings.map((team, index) => (
              <tr 
                key={team.id} 
                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${index < 2 ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {team.rank}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TeamFlag teamName={team.team_name} />
                    <span className="font-semibold">{team.team_name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-500">
                  {team.points}
                </td>
                <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{team.played}</td>
                <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{team.won}</td>
                <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{team.drawn}</td>
                <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{team.lost}</td>
                <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{team.goals_for}</td>
                <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{team.goals_against}</td>
                <td className="px-3 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                  {team.goals_diff > 0 ? `+${team.goals_diff}` : team.goals_diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
