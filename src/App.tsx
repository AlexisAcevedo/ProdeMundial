import { useAuth } from './hooks/useAuth'
import { Dashboard } from './pages/Dashboard'

function App() {
  const { user, isLoading, signInWithGoogle } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Cargando...</div>;
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <h1 className="mb-8 text-center text-3xl font-bold text-emerald-600 dark:text-emerald-500">ProdeMundial</h1>
        
        <div className="flex flex-col items-center gap-4">
          <p className="mb-4 text-center text-slate-600 dark:text-slate-300">
            Ingresa para comenzar a pronosticar los partidos y competir con tus amigos.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
          >
            Iniciar Sesión con Google
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
