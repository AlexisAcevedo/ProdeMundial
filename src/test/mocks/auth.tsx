import React from 'react'
import { AuthContext } from '../../contexts/AuthContext'
import type { User, Session } from '@supabase/supabase-js'

interface MockAuthProviderProps {
  children: React.ReactNode
  user?: User | null
  session?: Session | null
  isLoading?: boolean
  signInWithGoogle?: () => Promise<void>
  signOut?: () => Promise<void>
}

export function MockAuthProvider({
  children,
  user,
  session,
  isLoading = false,
  signInWithGoogle = async () => {},
  signOut = async () => {},
}: MockAuthProviderProps) {
  const hasUser = user !== null;
  const hasSession = session !== null;

  const defaultUser: User = (user === undefined)
    ? ({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any)
    : (user as User);

  const defaultSession: Session = (session === undefined)
    ? ({
        access_token: 'dummy_test_token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'dummy_refresh_token',
        user: defaultUser,
      } as any)
    : (session as Session);

  return (
    <AuthContext.Provider
      value={{
        user: hasUser ? defaultUser : null,
        session: hasSession ? defaultSession : null,
        isLoading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
