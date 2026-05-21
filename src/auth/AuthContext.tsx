import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from './types';
import type { AuthKind } from '../config/env';
import { ENV } from '../config/env';
import { DEMO_USERS } from './users';
import { createAuthService } from './authConfig';
import { logger } from '../observability/logger';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  user: User | null;
  status: AuthStatus;
  authMode: AuthKind;
  /** Email / password sign-in. Throws on failure. */
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Mock-only — switch demo principal live. */
  switchUser: (userId: string) => void;
  /** Mock-only — switchable users (empty in supabase mode). */
  availableUsers: User[];
}

const AuthContext = createContext<SessionState | null>(null);

/**
 * Auth state for the app. Backed by the swappable `AuthService`
 * (mock / Supabase). Holds the resolved domain `User`; RBAC and the data
 * layer consume that `User` and never see the provider.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => createAuthService(), []);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    service
      .restore()
      .then((session) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
        setStatus(session ? 'authenticated' : 'anonymous');
      })
      .catch((e: unknown) => {
        logger.error('auth', 'restore failed', e);
        if (!cancelled) {
          setUser(null);
          setStatus('anonymous');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await service.signIn(email, password);
      setUser(session.user);
      setStatus('authenticated');
    },
    [service],
  );

  const signOut = useCallback(async () => {
    await service.signOut();
    setUser(null);
    setStatus('anonymous');
  }, [service]);

  const switchUser = useCallback((userId: string) => {
    const next = DEMO_USERS.find((u) => u.id === userId);
    if (next) {
      setUser(next);
      setStatus('authenticated');
    }
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      user,
      status,
      authMode: ENV.auth,
      signIn,
      signOut,
      switchUser,
      availableUsers: ENV.auth === 'mock' ? DEMO_USERS : [],
    }),
    [user, status, signIn, signOut, switchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Full auth state, including the not-yet-authenticated case. */
export function useSession(): SessionState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSession must be used within <AuthProvider>.');
  return ctx;
}

/**
 * Authenticated-only view of auth state. Asserts a non-null `user` —
 * safe for any component rendered inside the <AuthGate>.
 */
export function useAuth(): Omit<SessionState, 'user'> & { user: User } {
  const ctx = useSession();
  if (!ctx.user) {
    throw new Error('useAuth used outside an authenticated area.');
  }
  return { ...ctx, user: ctx.user };
}
