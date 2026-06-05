import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

declare global {
  interface Window {
    E2E_USER?: any;
    E2E_SESSION?: any;
  }
}

export function useAuth() {
  // Soporte para testing E2E (Playwright) bypass auth
  if (typeof window !== 'undefined' && window.E2E_USER) {
    return {
      user: window.E2E_USER,
      session: window.E2E_SESSION || null,
      isLoading: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
    };
  }

  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}