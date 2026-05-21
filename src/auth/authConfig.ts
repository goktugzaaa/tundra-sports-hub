import type { AuthService } from './AuthService';
import { MockAuthService } from './providers/mock/MockAuthService';
import { SupabaseAuthService } from './providers/supabase/SupabaseAuthService';
import { ENV } from '../config/env';
import { logger } from '../observability/logger';

/**
 * AUTH PROVIDER SELECTION — the one place the identity provider is chosen.
 * Driven by `VITE_AUTH`. Defaults to 'mock' (zero-config).
 */
export const ACTIVE_AUTH = ENV.auth;

export function createAuthService(): AuthService {
  logger.info('auth', `Initialising auth provider: ${ENV.auth}`);
  if (ENV.auth === 'supabase') {
    return new SupabaseAuthService({
      url: ENV.supabase.url,
      anonKey: ENV.supabase.anonKey,
    });
  }
  return new MockAuthService();
}
