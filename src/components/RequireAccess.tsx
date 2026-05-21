import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canAccess, type Resource } from '../rbac';

/**
 * Route-level RBAC guard. Blocks a whole section when the user's role
 * lacks read capability on its resource — the UI-level complement to the
 * service layer's data filtering. Defense in depth: even if a user nav-
 * igates here by URL, the guard stops the render.
 */
export function RequireAccess({
  resource,
  children,
}: {
  resource: Resource;
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!canAccess(user, resource, 'read')) {
    return (
      <div className="access-denied">
        <div className="lock">🔒</div>
        <h2>Access restricted</h2>
        <p>
          Your role ({user.role}) does not have access to this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
