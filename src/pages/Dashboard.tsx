import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMatches } from '../hooks/useMatches';
import { usePredictions } from '../hooks/usePredictions';
import { useLeagues } from '../hooks/useLeagues';
import { useTheme } from '../hooks/useTheme';
import { MatchTabs } from '../components/MatchTabs';
import { LeagueDetails } from '../components/LeagueDetails';
import type { League } from '../lib/types';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { matches, isLoading: loadingMatches } = useMatches();
  const { predictions, submitPrediction, isLoading: loadingPredictions } = usePredictions();
  const { leagues, joinLeague, createLeague, isLoading: loadingLeagues } = useLeagues();
  const { theme, toggleTheme } = useTheme();
  
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-fifa-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <div className="text-slate-500 dark:text-slate-400 font-medium">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-fifa-dark dark:text-slate-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none hidden dark:block z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent-teal/10 blur-[100px] rounded-full pointer-events-none hidden dark:block z-0"></div>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-white/5 dark:bg-fifa-dark/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Prode<span className="text-brand-600 dark:text-brand-400">Mundial</span></h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-colors"
              title="Cambiar tema"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <span className="hidden text-sm sm:inline text-slate-500 dark:text-slate-400">{user?.email}</span>
            <button 
              onClick={signOut}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 active:scale-95 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:py-8 relative z-10">
        {selectedLeague ? (
          <LeagueDetails league={selectedLeague} onBack={() => setSelectedLeague(null)} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Partidos
            </h2>
            <MatchTabs
              matches={matches}
              predictions={predictions}
              onSubmit={submitPrediction}
            />
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Mis Ligas
              </h2>
              {leagues.length === 0 ? (
                <p className="mb-4 text-sm text-slate-500">No estás en ninguna liga.</p>
              ) : (
                <ul className="mb-4 space-y-2">
                  {leagues.map((league) => (
                    <li 
                      key={league.id} 
                      onClick={() => setSelectedLeague(league)}
                      className="group flex cursor-pointer flex-col rounded-xl bg-slate-50/50 px-4 py-3 text-sm transition-all hover:bg-white hover:shadow-sm dark:bg-white/5 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    >
                      <span className="font-medium text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-100 dark:group-hover:text-brand-400">{league.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Código: <span className="font-mono text-slate-400 dark:text-slate-500">{league.invite_code}</span></span>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleJoinLeague} className="mt-5 border-t border-slate-100 pt-5 dark:border-white/10">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Unirse con código</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ej. ABC123"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-brand-500 dark:focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={!inviteCode}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    Unirse
                  </button>
                </div>
                {leagueError && <p className="mt-2 text-xs text-red-500">{leagueError}</p>}
              </form>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                Crear Liga
              </h2>
              <form onSubmit={handleCreateLeague}>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de la liga</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    placeholder="Ej. Torneo Oficina"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-brand-500 dark:focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={!newLeagueName}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
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
