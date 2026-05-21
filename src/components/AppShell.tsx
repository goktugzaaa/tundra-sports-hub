import { NavLink, Outlet } from 'react-router-dom';
import { RoleSwitcher } from './RoleSwitcher';
import { useAuth } from '../auth/AuthContext';
import { canAccess, type Resource } from '../rbac';
import { navIcons } from '../ui/icons';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  /** Resource gating this link — omitted means always visible. */
  resource?: Resource;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/athletes', label: 'Athletes', icon: 'athletes', resource: 'athlete' },
  { to: '/prospects', label: 'Prospects', icon: 'prospects', resource: 'prospect' },
  { to: '/deals', label: 'NIL Deals', icon: 'deals', resource: 'deal' },
  { to: '/payments', label: 'Payments', icon: 'payments', resource: 'payment' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks', resource: 'task' },
  { to: '/compliance', label: 'Compliance', icon: 'compliance', resource: 'compliance' },
  { to: '/documents', label: 'Documents', icon: 'documents', resource: 'document' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

/**
 * App layout: sidebar (brand + nav) · topbar (workspace + identity) ·
 * routed content. Nav links the user cannot access are hidden — UI-level
 * RBAC mirroring the route guard and service-layer filtering.
 */
export function AppShell() {
  const { user } = useAuth();

  const visibleNav = NAV.filter(
    (item) => !item.resource || canAccess(user, item.resource, 'read'),
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <div className="brand-name">Tundra</div>
            <div className="brand-sub">Sports Hub</div>
          </div>
        </div>

        <div className="nav-section">Workspace</div>
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            {navIcons[item.icon]}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </aside>

      <div className="main-col">
        <header className="topbar">
          <span className="topbar-ws">Tundra Sports Group</span>
          <RoleSwitcher />
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
