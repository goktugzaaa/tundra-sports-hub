import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { ScopedDataService } from './ScopedDataService';
import { createDataProvider } from './config';
import type { DataProvider } from './DataProvider';
import { useAuth } from '../auth/AuthContext';

/**
 * DEPENDENCY INJECTION for the data layer.
 *
 * Builds the concrete DataProvider exactly once, then exposes a
 * `ScopedDataService` bound to the current user. When the user/role
 * changes, the scoped service is rebuilt — the provider is not.
 *
 * Modules consume `useDataService()` and never see the provider.
 */
const DataServiceContext = createContext<ScopedDataService | null>(null);

export function DataServiceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Provider is a session singleton — created once, survives role switches.
  const providerRef = useRef<DataProvider | null>(null);
  if (providerRef.current === null) {
    providerRef.current = createDataProvider();
  }

  const service = useMemo(
    () => new ScopedDataService(providerRef.current as DataProvider, user),
    [user],
  );

  return (
    <DataServiceContext.Provider value={service}>
      {children}
    </DataServiceContext.Provider>
  );
}

/** RBAC-scoped data access for the current user. */
export function useDataService(): ScopedDataService {
  const ctx = useContext(DataServiceContext);
  if (!ctx) {
    throw new Error('useDataService must be used within <DataServiceProvider>.');
  }
  return ctx;
}
