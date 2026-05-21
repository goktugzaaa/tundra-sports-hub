import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { AuthGate } from '../components/AuthGate';
import { DataServiceProvider } from '../services';
import { ErrorBoundary } from '../observability/ErrorBoundary';
import { App } from './App';

/**
 * Composition root. Wires providers in dependency order:
 *   ErrorBoundary -> Auth -> AuthGate -> DataService -> Router.
 *
 * The AuthGate sits above DataService so the data layer (and every
 * module) only ever mounts with an authenticated `User`.
 */
export function AppProviders() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate>
          <DataServiceProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </DataServiceProvider>
        </AuthGate>
      </AuthProvider>
    </ErrorBoundary>
  );
}
