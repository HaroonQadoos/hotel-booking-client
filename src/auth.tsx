import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from './api';
import type { AuthUser } from './api';

interface AuthState {
  user: AuthUser | null;
  /** False until the session has been checked, so guards don't flash. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: api.RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // With the token in an httpOnly cookie there is nothing here to inspect —
  // this code cannot see the cookie, only send it. So "am I signed in?" is a
  // question only the API can answer: a 200 means yes, a 401 means no.
  useEffect(() => {
    let cancelled = false;

    api
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        });
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api.login(email, password);
    setUser(session.user);
  }, []);

  // Registering opens a session too, so a new account lands signed in.
  const signUp = useCallback(async (input: api.RegisterInput) => {
    const session = await api.register(input);
    setUser(session.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      // Clear locally even if the call failed. Leaving a stale user on screen
      // after someone pressed sign out is worse than a cookie that outlives
      // the click — and it expires on its own.
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signOut }),
    [user, ready, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
