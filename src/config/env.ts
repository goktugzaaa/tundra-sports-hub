/**
 * CENTRAL ENVIRONMENT CONFIG.
 *
 * The single place env vars are read. Nothing else touches `import.meta.env`.
 * Keeps config out of business code and makes every runtime assumption
 * explicit and testable.
 *
 * All vars are optional — with none set the app runs fully on mock data
 * and mock auth.
 */

export type BackendKind = 'mock' | 'airtable';
export type AuthKind = 'mock' | 'supabase';

function readBackend(): BackendKind {
  return import.meta.env.VITE_BACKEND === 'airtable' ? 'airtable' : 'mock';
}

function readAuth(): AuthKind {
  return import.meta.env.VITE_AUTH === 'supabase' ? 'supabase' : 'mock';
}

export const ENV = {
  /** Active data source. Defaults to 'mock'. */
  backend: readBackend(),

  /** Active auth provider. Defaults to 'mock'. */
  auth: readAuth(),

  /** Debug logging toggle. `VITE_DEBUG=true` to enable. */
  debug: import.meta.env.VITE_DEBUG === 'true',

  /** Build mode — provided by Vite. */
  isProduction: import.meta.env.PROD,

  /**
   * Airtable settings. Only consulted when backend === 'airtable'.
   *
   * SECURITY: a raw Airtable token in a browser bundle is NOT secret.
   * In production set `proxyUrl` to a serverless function that holds the
   * token server-side; leave `apiKey` empty in client builds.
   */
  airtable: {
    apiKey: import.meta.env.VITE_AIRTABLE_API_KEY ?? '',
    baseId: import.meta.env.VITE_AIRTABLE_BASE_ID ?? '',
    proxyUrl: import.meta.env.VITE_AIRTABLE_PROXY_URL ?? '',
  },

  /**
   * Supabase auth settings. Only consulted when auth === 'supabase'.
   * The anon key is public by design — Supabase Row-Level Security is
   * the real access boundary, so RLS MUST be configured on the project.
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
} as const;
