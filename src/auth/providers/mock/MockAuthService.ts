import type { AuthService, AuthSession } from '../../AuthService';
import { DEMO_USERS } from '../../users';
import { logger } from '../../../observability/logger';

/**
 * Mock auth provider — zero-config default.
 *
 * No persisted session: the app always opens on the sign-in screen, which
 * presents the demo accounts as one-click entries. `signIn` matches a demo
 * user by email (password ignored). The topbar role switcher drives
 * day-to-day identity changes once inside.
 */
export class MockAuthService implements AuthService {
  async restore(): Promise<AuthSession | null> {
    logger.debug('auth.mock', 'no persisted session — showing sign-in');
    return null;
  }

  async signIn(email: string): Promise<AuthSession> {
    const user = DEMO_USERS.find((u) => u.email === email);
    if (!user) throw new Error('No demo user with that email.');
    return { user };
  }

  async signOut(): Promise<void> {
    /* no-op — mock sessions are not persisted */
  }
}
