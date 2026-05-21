import { useSession } from '../auth/AuthContext';

/**
 * Topbar identity control.
 *  - mock auth  → demo principal switcher (drives live RBAC testing)
 *  - real auth  → signed-in identity + sign-out
 */
export function RoleSwitcher() {
  const { user, authMode, availableUsers, switchUser, signOut } = useSession();
  if (!user) return null;

  if (authMode === 'mock') {
    return (
      <div className="role-switcher">
        <div className="rs-meta">
          <span className="rs-label">Acting as</span>
          <select
            aria-label="Switch user"
            value={user.id}
            onChange={(e) => switchUser(e.target.value)}
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.role}
              </option>
            ))}
          </select>
        </div>
        <span className="avatar">{user.name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div className="role-switcher">
      <div className="rs-meta">
        <span className="rs-label">{user.role}</span>
        <span className="rs-name">{user.name}</span>
      </div>
      <span className="avatar">{user.name.charAt(0)}</span>
      <button className="btn" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}
