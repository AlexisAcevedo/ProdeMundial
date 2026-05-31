import { useAuth } from './hooks/useAuth'
import { Dashboard } from './pages/Dashboard'
import { useTheme } from './hooks/useTheme'

function App() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Cargando...</div>;
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-fifa-dark relative overflow-hidden">
      {/* Botón flotante para cambiar el tema */}
      <button 
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 rounded-full p-2.5 bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/5 transition-all"
        title="Cambiar tema"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>

      {/* Elementos decorativos de fondo para dark mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none hidden dark:block"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent-teal/10 blur-[100px] rounded-full pointer-events-none hidden dark:block"></div>
      
      <div className="w-full max-w-md rounded-2xl glass-panel p-8 relative z-10">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-teal shadow-lg shadow-brand-500/30 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          </div>
          <h1 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Prode<span className="text-brand-600 dark:text-brand-400">Mundial</span>
          </h1>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <p className="text-center text-slate-600 dark:text-slate-300 leading-relaxed">
            Ingresá para pronosticar los partidos de la Copa Mundial 2026 y competir con tus amigos.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-white dark:bg-fifa-card px-4 py-3.5 font-semibold text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 transition-all duration-300 hover:border-brand-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-accent-teal/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <svg className="h-5 w-5 relative z-10" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="relative z-10">Continuar con Google</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
