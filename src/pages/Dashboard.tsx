import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMatches } from '../hooks/useMatches';
import { usePredictions } from '../hooks/usePredictions';
import { useLeagues } from '../hooks/useLeagues';
import { useTheme } from '../hooks/useTheme';
import { MatchTabs } from '../components/MatchTabs';
import { LeagueDetails } from '../components/LeagueDetails';
import type { League } from '../lib/types';
import { usePendingPredictions } from '../hooks/usePendingPredictions';
import { PendingBadge } from '../components/PendingBadge';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { ProfileModal } from '../components/ProfileModal';
import { Skeleton, MatchCardSkeleton } from '../components/Skeleton';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { matches, isLoading: loadingMatches } = useMatches();
  const { predictions, submitPrediction, submitPredictions, isLoading: loadingPredictions } = usePredictions();
  const { leagues, joinLeague, createLeague, isLoading: loadingLeagues } = useLeagues();
  const { theme, toggleTheme } = useTheme();
  
  const [inviteCode, setInviteCode] = useState('');
  const [newLeagueName, setNewLeagueName] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket' | 'ranking' | 'history' | 'bulk'>('groups');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null }>({ name: null, avatar_url: null });

  const { addToast } = useToast();
  const { pendingCount } = usePendingPredictions(matches, predictions);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data) {
          setProfile({ name: data.name, avatar_url: data.avatar_url });
        }
      } catch (err) {
        console.error('Error al cargar perfil público', err);
      }
    }
    fetchProfile();
  }, [user]);

  const handleProfileUpdate = (name: string, avatarUrl: string) => {
    setProfile({ name, avatar_url: avatarUrl });
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    
    try {
      await joinLeague(inviteCode);
      setInviteCode('');
      addToast('¡Te uniste a la liga con éxito!', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Error al unirse a la liga', 'error');
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName) return;
    
    try {
      await createLeague(newLeagueName);
      setNewLeagueName('');
      addToast('¡Liga creada con éxito!', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Error al crear la liga', 'error');
    }
  };

  const isLoading = loadingMatches || loadingPredictions || loadingLeagues;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-fifa-dark dark:text-slate-100 p-4 sm:p-6 md:p-8 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton width="180px" height="28px" />
            <Skeleton width="100px" height="14px" />
          </div>
          <Skeleton variant="circular" width="40px" height="40px" />
        </div>

        {/* Banner Skeleton */}
        <Skeleton height="70px" className="w-full" />

        {/* Tab switcher Skeleton */}
        <div className="flex gap-2">
          <Skeleton width="110px" height="40px" />
          <Skeleton width="110px" height="40px" />
          <Skeleton width="110px" height="40px" />
        </div>

        {/* Main Content: Match Cards Skeletons */}
        <div className="grid gap-4 sm:grid-cols-2">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
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
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-2 sm:px-6 lg:px-8">
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 text-left hover:bg-slate-100 dark:hover:bg-white/5 p-1.5 rounded-xl transition-colors"
                title="Editar perfil"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-white/10 shrink-0" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold shrink-0">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {profile.name || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                    {user?.email}
                  </span>
                </div>
              </button>
              <PendingBadge count={pendingCount} />
            </div>
            <button 
              onClick={signOut}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 active:scale-95 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1920px] p-4 sm:px-6 lg:px-8 md:py-8 relative z-10">
        {selectedLeague ? (
          <LeagueDetails league={selectedLeague} onBack={() => setSelectedLeague(null)} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_240px] xl:grid-cols-[1fr_280px]">
            <div className="min-w-0">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Partidos
            </h2>
            
            {pendingCount > 0 && activeTab !== 'bulk' && (
              <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center justify-between gap-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-pulse">⚡</span>
                  <div>
                    <h4 className="font-bold text-amber-800 dark:text-amber-400">Tenés pronósticos pendientes</h4>
                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80">Te quedan {pendingCount} {pendingCount === 1 ? 'partido' : 'partidos'} por pronosticar.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-4 py-2 text-xs font-bold shadow-sm transition-all"
                >
                  Pronosticar ahora
                </button>
              </div>
            )}

            <MatchTabs
              matches={matches}
              predictions={predictions}
              onSubmit={submitPrediction}
              onSubmitBulk={submitPredictions}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          <div className="space-y-4">
            {/* Espaciador invisible para alinear las cards con las tabs de secciones */}
            <div className="mb-6 hidden h-8 lg:block" />
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <h2 className="mb-3 text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
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
              </form>
            </div>
          </div>
        </div>
        )}
      </main>

      {showProfileModal && user && (
        <ProfileModal
          userId={user.id}
          currentName={profile.name}
          currentAvatarUrl={profile.avatar_url}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
