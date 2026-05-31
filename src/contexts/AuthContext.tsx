/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Interfaz que define la estructura del contexto de autenticación.
 */
interface AuthContextType {
  /** Sesión actual activa provista por Supabase */
  session: Session | null;
  /** Datos del usuario autenticado */
  user: User | null;
  /** Indicador de si el estado inicial se está cargando */
  isLoading: boolean;
  /**
   * Inicia el flujo de autenticación OAuth con Google.
   * Redirige a la página principal una vez logueado.
   */
  signInWithGoogle: () => Promise<void>;
  /** Cierra la sesión activa en el cliente y en Supabase */
  signOut: () => Promise<void>;
}

/**
 * Contexto global que provee el estado de la sesión de usuario y métodos de autenticación.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor de estado global de sesión de usuario y métodos OAuth.
 * Este componente debe envolver a la aplicación entera para proveer el contexto de autenticación.
 * 
 * @param children - Elementos React hijos a renderizar dentro del contexto
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}