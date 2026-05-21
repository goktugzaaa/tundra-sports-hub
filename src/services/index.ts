/**
 * Service layer barrel — the data-access boundary.
 *
 * Everything above this layer imports from here. No module ever imports
 * a concrete provider (MockDataProvider / AirtableProvider) directly.
 */
export type { DataProvider } from './DataProvider';
export { ScopedDataService } from './ScopedDataService';
export { createDataProvider, ACTIVE_BACKEND, type BackendKind } from './config';
export { useDataService, DataServiceProvider } from './DataServiceContext';
