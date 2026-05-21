import type { DataProvider } from './DataProvider';
import { MockDataProvider } from './providers/mock/MockDataProvider';
import { AirtableDataProvider } from './providers/airtable/AirtableProvider';
import { ENV, type BackendKind } from '../config/env';
import { logger } from '../observability/logger';

/**
 * BACKEND SELECTION — the one place the data source is chosen.
 *
 * Driven by env (`config/env.ts`). Defaults to 'mock' so the app runs
 * with zero configuration. Swapping backends is one env var — nothing
 * above the service layer changes.
 */
export type { BackendKind };

export const ACTIVE_BACKEND: BackendKind = ENV.backend;

/** Builds the active DataProvider from environment config. */
export function createDataProvider(): DataProvider {
  logger.info('service.backend', `Initialising data source: ${ENV.backend}`);

  if (ENV.backend === 'airtable') {
    return new AirtableDataProvider({
      apiKey: ENV.airtable.apiKey,
      baseId: ENV.airtable.baseId,
      proxyUrl: ENV.airtable.proxyUrl || undefined,
    });
  }

  // Mock — default, zero-config. errorRate can be raised to exercise error UI.
  return new MockDataProvider({ minLatencyMs: 300, maxLatencyMs: 800, errorRate: 0 });
}
