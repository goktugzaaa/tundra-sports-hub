import type { User } from './types';

/**
 * AUTH ABSTRACTION CONTRACT.
 *
 * The single boundary between the app and any identity provider. The
 * AuthContext depends on THIS interface — never on a concrete provider.
 *
 * Swap the implementation (mock, Supabase, Clerk, Auth0) without touching
 * RBAC, modules, or the data layer. The resolved `User` shape is identical
 * regardless of provider.
 */
export interface AuthSession {
  user: User;
  /** Bearer token, when the provider issues one. */
  accessToken?: string;
}

export interface AuthService {
  /** Restore a persisted session on app load. Resolves null if none. */
  restore(): Promise<AuthSession | null>;
  /** Email / password sign-in. Rejects with a readable error on failure. */
  signIn(email: string, password: string): Promise<AuthSession>;
  /** Clear the session. */
  signOut(): Promise<void>;
}
