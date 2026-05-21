import type { ReactNode } from 'react';
import { useSession } from '../auth/AuthContext';
import { LoginView } from '../auth/LoginView';

/**
 * Auth boundary. Renders children only once a session exists, so every
 * component below can safely assume an authenticated `User`. Anonymous
 * sessions get the login screen; restoring sessions get a spinner.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="login-screen">
        <span className="spinner" />
      </div>
    );
  }

  if (status === 'anonymous') {
    return <LoginView />;
  }

  return <>{children}</>;
}
