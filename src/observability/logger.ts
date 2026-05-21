import { ENV } from '../config/env';

/**
 * Logging abstraction. Single seam for all diagnostics — swap the sink
 * (console now; Sentry/Datadog later) without touching call sites.
 *
 * `debug` output is suppressed unless VITE_DEBUG=true, so production
 * builds stay quiet by default.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, scope: string, args: unknown[]): void {
  if (level === 'debug' && !ENV.debug) return;
  const sink =
    level === 'error' ? console.error
    : level === 'warn' ? console.warn
    : console.log;
  sink(`[${level}] ${scope}`, ...args);
}

export const logger = {
  debug: (scope: string, ...args: unknown[]) => emit('debug', scope, args),
  info: (scope: string, ...args: unknown[]) => emit('info', scope, args),
  warn: (scope: string, ...args: unknown[]) => emit('warn', scope, args),
  error: (scope: string, ...args: unknown[]) => emit('error', scope, args),
};
