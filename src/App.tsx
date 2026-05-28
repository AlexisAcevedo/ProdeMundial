import { useAuth } from './hooks/useAuth'

function App() {
  const { user, isLoading, signInWithGoogle, signOut } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md dark:bg-slate-800">
        <h1 className="mb-6 text-center text-2xl font-bold">ProdeMundial</h1>
        
        {user ? (
          <div className="flex flex-col items-center gap-4">
            <p>Bienvenido, {user.email}</p>
            <button 
              onClick={signOut}
              className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-800 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={signInWithGoogle}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Iniciar Sesión con Google
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App