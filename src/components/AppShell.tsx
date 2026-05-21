import { NavLink, Outlet } from 'react-router-dom';
import { RoleSwitcher } from './RoleSwitcher';
import { useAuth } from '../auth/AuthContext';
import { canAccess, type Resource } from '../rbac';
import { ACTIVE_BACKEND } from '../services';
import { navIcons } from '../ui/icons';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  /** Resource gating this link — omitted means always visible. */
  resource?: Resource;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    label: 'Recruitment',
    items: [
      { to: '/athletes', label: 'Athletes', icon: 'athletes', resource: 'athlete' },
      { to: '/prospects', label: 'Prospects', icon: 'prospects', resource: 'prospect' },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { to: '/deals', label: 'NIL Deals', icon: 'deals', resource: 'deal' },
      { to: '/payments', label: 'Payments', icon: 'payments', resource: 'payment' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/tasks', label: 'Tasks', icon: 'tasks', resource: 'task' },
      { to: '/compliance', label: 'Compliance', icon: 'compliance', resource: 'compliance' },
      { to: '/documents', label: 'Documents', icon: 'documents', resource: 'document' },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: 'settings' }],
  },
];

/**
 * App layout: sidebar (brand · grouped nav · environment) · topbar
 * (workspace + identity) · routed content. Nav items the user cannot
 * access are hidden; a group with no visible items is dropped entirely.
 */
export function AppShell() {
  const { user } = useAuth();

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

        <nav className="nav">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter(
              (item) => !item.resource || canAccess(user, item.resource, 'read'),
            );
            if (items.length === 0) return null;
            return (
              <div className="nav-group" key={group.label}>
                <div className="nav-section">{group.label}</div>
                {items.map((item) => (
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
              </div>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="env-chip">
            <span className="env-dot" />
            <span>
              {ACTIVE_BACKEND === 'mock' ? 'Mock data' : 'Airtable'} · V1
            </span>
          </div>
        </div>
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
