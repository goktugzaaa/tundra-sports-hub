import type { AuthService, AuthSession } from '../../AuthService';
import type { User } from '../../types';
import type { Role } from '../../../rbac';
import { logger } from '../../../observability/logger';

const TOKEN_KEY = 'tundra.auth.token';

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
}

/**
 * Supabase auth provider — talks to the GoTrue REST API directly (no SDK
 * dependency, consistent with the Airtable adapter).
 *
 * A drop-in `AuthService`: switching from mock auth touches nothing in
 * RBAC, modules, or the data layer — the resolved `User` shape is identical.
 *
 * SECURITY: the anon key is public by design. Supabase Row-Level Security
 * is the real access boundary and MUST be configured on the project.
 */
export class SupabaseAuthService implements AuthService {
  private readonly base: string;

  constructor(private readonly cfg: SupabaseAuthConfig) {
    if (!cfg.url || !cfg.anonKey) {
      throw new Error(
        'SupabaseAuthService needs VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY, ' +
          'or run with VITE_AUTH=mock (default).',
      );
    }
    this.base = `${cfg.url.replace(/\/$/, '')}/auth/v1`;
  }

  async restore(): Promise<AuthSession | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const user = await this.fetchUser(token);
      return { user, accessToken: token };
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${this.base}/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: this.cfg.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      logger.warn('auth.supabase', 'sign-in failed', res.status);
      throw new Error('Invalid email or password.');
    }
    const json = (await res.json()) as { access_token: string; user: SupabaseUser };
    localStorage.setItem(TOKEN_KEY, json.access_token);
    return { user: toUser(json.user), accessToken: json.access_token };
  }

  async signOut(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    if (!token) return;
    await fetch(`${this.base}/logout`, {
      method: 'POST',
      headers: { apikey: this.cfg.anonKey, Authorization: `Bearer ${token}` },
    }).catch(() => {
      /* best-effort — local token is already cleared */
    });
  }

  private async fetchUser(token: string): Promise<User> {
    const res = await fetch(`${this.base}/user`, {
      headers: { apikey: this.cfg.anonKey, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Session expired.');
    return toUser((await res.json()) as SupabaseUser);
  }
}

/**
 * Maps a Supabase user to the domain `User`. Role and RBAC scoping ids
 * are read from `user_metadata` — the Tundra Supabase project must
 * populate { role, recruiterId, athleteId, name } there (or via a
 * profiles table joined at sign-in).
 */
function toUser(su: SupabaseUser): User {
  const meta = su.user_metadata ?? {};
  return {
    id: su.id,
    name: (meta.name as string | undefined) ?? su.email ?? 'User',
    email: su.email,
    role: (meta.role as Role | undefined) ?? 'ATHLETE',
    recruiterId: meta.recruiterId as string | undefined,
    athleteId: meta.athleteId as string | undefined,
  };
}
