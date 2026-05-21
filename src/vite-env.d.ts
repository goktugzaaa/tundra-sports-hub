/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Active backend: 'mock' (default) or 'airtable'. */
  readonly VITE_BACKEND?: 'mock' | 'airtable';
  /** Active auth provider: 'mock' (default) or 'supabase'. */
  readonly VITE_AUTH?: 'mock' | 'supabase';
  /** Enable debug logging when 'true'. */
  readonly VITE_DEBUG?: string;
  /** Airtable personal access token — client builds: prefer leaving empty + using a proxy. */
  readonly VITE_AIRTABLE_API_KEY?: string;
  /** Airtable base id (appXXXXXXXXXXXXXX). */
  readonly VITE_AIRTABLE_BASE_ID?: string;
  /** Serverless proxy base URL — keeps the Airtable token server-side. */
  readonly VITE_AIRTABLE_PROXY_URL?: string;
  /** Supabase project URL (https://xxxx.supabase.co). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
