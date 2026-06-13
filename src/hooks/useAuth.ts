import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

declare global {
  interface Window {
    E2E_USER?: unknown;
    E2E_SESSION?: unknown;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);

  // Soporte para testing E2E (Playwright) bypass auth
  if (typeof window !== 'undefined' && window.E2E_USER) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user: window.E2E_USER as any, // Only for E2E testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session: window.E2E_SESSION as any || null,
      isLoading: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    };
  }

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}