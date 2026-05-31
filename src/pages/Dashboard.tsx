import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMatches } from '../hooks/useMatches';
import { usePredictions } from '../hooks/usePredictions';
import { useLeagues } from '../hooks/useLeagues';
import { MatchTabs } from '../components/MatchTabs';
import { LeagueDetails } from '../components/LeagueDetails';
import type { League } from '../lib/types';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { matches, isLoading: loadingMatches } = useMatches();
  const { predictions, submitPrediction, isLoading: loadingPredictions } = usePredictions();
  const { leagues, joinLeague, createLeague, isLoading: loadingLeagues } = useLeagues();
  
  const [inviteCode, setInviteCode] = useState('');
  const [leagueError, setLeagueError] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [createLeagueError, setCreateLeagueError] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    
    setLeagueError('');
    try {
      await joinLeague(inviteCode);
      setInviteCode('');
    } catch (err: any) {
      setLeagueError(err.message);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName) return;
    
    setCreateLeagueError('');
    try {
      await createLeague(newLeagueName);
      setNewLeagueName('');
    } catch (err: any) {
      setCreateLeagueError(err.message);
    }
  };

  const isLoading = loadingMatches || loadingPredictions || loadingLeagues;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-500">ProdeMundial</h1>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm sm:inline">{user?.email}</span>
            <button 
              onClick={signOut}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:py-8">
        {selectedLeague ? (
          <LeagueDetails league={selectedLeague} onBack={() => setSelectedLeague(null)} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div>
            <h2 className="mb-6 text-2xl font-bold">Partidos</h2>
            <MatchTabs
              matches={matches}
              predictions={predictions}
              onSubmit={submitPrediction}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-bold">Mis Ligas</h2>
              {leagues.length === 0 ? (
                <p className="mb-4 text-sm text-slate-500">No estás en ninguna liga.</p>
              ) : (
                <ul className="mb-4 space-y-2">
                  {leagues.map((league) => (
                    <li 
                      key={league.id} 
                      onClick={() => setSelectedLeague(league)}
                      className="group flex cursor-pointer flex-col rounded-lg bg-slate-50 px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800"
                    >
                      <span className="font-medium text-emerald-600 transition-colors group-hover:text-emerald-700 dark:text-emerald-400 dark:group-hover:text-emerald-300">{league.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Código: {league.invite_code}</span>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleJoinLeague} className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                <label className="mb-2 block text-sm font-medium">Unirse con código</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ej. ABC123"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!inviteCode}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    Unirse
                  </button>
                </div>
                {leagueError && <p className="mt-2 text-xs text-red-500">{leagueError}</p>}
              </form>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h2 className="mb-4 text-lg font-bold">Crear Liga</h2>
              <form onSubmit={handleCreateLeague}>
                <label className="mb-2 block text-sm font-medium">Nombre de la liga</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    placeholder="Ej. Torneo Oficina"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!newLeagueName}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
                  >
                    Crear
                  </button>
                </div>
                {createLeagueError && <p className="mt-2 text-xs text-red-500">{createLeagueError}</p>}
              </form>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
