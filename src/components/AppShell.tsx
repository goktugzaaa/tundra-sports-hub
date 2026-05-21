import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { Onboarding } from './Onboarding';
import { useAuth, useSession } from '../auth/AuthContext';
import { canAccess, type Resource } from '../rbac';
import { Ic, initials } from '../ui/ops';

interface NavItem {
  to: string;
  label: string;
  icon: keyof typeof Ic;
  end?: boolean;
  resource?: Resource;
  beta?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Work',
    items: [
      { to: '/', label: 'Today', icon: 'dashboard', end: true },
      { to: '/tasks', label: 'Tasks', icon: 'tasks', resource: 'task' },
    ],
  },
  {
    label: 'Roster',
    items: [
      { to: '/athletes', label: 'Athletes', icon: 'athletes', resource: 'athlete' },
      { to: '/prospects', label: 'Prospects', icon: 'prospects', resource: 'prospect' },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { to: '/deals', label: 'NIL deals', icon: 'deals', resource: 'deal' },
      { to: '/payments', label: 'Payments', icon: 'payments', resource: 'payment' },
    ],
  },
  {
    label: 'Governance',
    items: [
      { to: '/compliance', label: 'Compliance', icon: 'compliance', resource: 'compliance', beta: true },
      { to: '/documents', label: 'Documents', icon: 'documents', resource: 'document' },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: 'settings' }],
  },
];

/** Breadcrumb labels keyed by route path. */
const CRUMBS: Record<string, string[]> = {
  '/': ['Today'],
  '/athletes': ['Roster', 'Athletes'],
  '/prospects': ['Roster', 'Prospects'],
  '/deals': ['Revenue', 'NIL deals'],
  '/payments': ['Revenue', 'Payments'],
  '/tasks': ['Work', 'Tasks'],
  '/compliance': ['Governance', 'Compliance'],
  '/documents': ['Governance', 'Documents'],
  '/settings': ['System', 'Settings'],
};

function crumbsFor(pathname: string): string[] {
  if (CRUMBS[pathname]) return CRUMBS[pathname];
  if (pathname.startsWith('/athletes/')) return ['Roster', 'Athletes', 'Record'];
  if (pathname.startsWith('/deals/')) return ['Revenue', 'NIL deals', 'Record'];
  return ['Tundra Hub'];
}

function nowStamp(): string {
  const d = new Date();
  const day = d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} · ${time}`;
}

/**
 * Operator shell — narrow grouped sidebar · single-line context topbar ·
 * routed content. Sidebar collapses to an off-canvas drawer below 860px.
 */
export function AppShell() {
  const { user } = useAuth();
  const { authMode, availableUsers, switchUser, signOut } = useSession();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  const crumbs = crumbsFor(location.pathname);

  return (
    <div className={'op-board' + (navOpen ? ' nav-open' : '')}>
      <aside className="op-side">
        <div className="brand">
          <img className="op-brand-logo" src="/logo.png" alt="Tundra Hub" />
        </div>

        <nav>
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter(
              (item) => !item.resource || canAccess(user, item.resource, 'read'),
            );
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <div className="group-label">{group.label}</div>
                {items.map((item) => {
                  const Icon = Ic[item.icon];
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setNavOpen(false)}
                      className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                    >
                      <Icon />
                      <span>
                        {item.label}
                        {item.beta && <span className="op-beta">Beta</span>}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}

          <div className="op-recent">
            <div className="op-recent-label">Recently viewed</div>
            <NavLink to="/athletes" className="op-recent-item" onClick={() => setNavOpen(false)}>
              <span className="mini">MR</span>
              <span>Marcus Reed</span>
            </NavLink>
            <NavLink to="/athletes" className="op-recent-item" onClick={() => setNavOpen(false)}>
              <span className="mini">ES</span>
              <span>Eli Sato</span>
            </NavLink>
            <NavLink to="/payments" className="op-recent-item" onClick={() => setNavOpen(false)}>
              <span className="mini">IN</span>
              <span>INV-2284 · PUMA</span>
            </NavLink>
          </div>
        </nav>

        <div className="op-side-foot">
          <div className="who-mark">{initials(user.name)}</div>
          <div>
            <div className="who-name">{user.name}</div>
            <div className="who-role">{user.role}</div>
          </div>
          {authMode === 'mock' ? (
            <select
              aria-label="Switch user"
              value={user.id}
              onChange={(e) => switchUser(e.target.value)}
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : (
            <button className="more" title="Sign out" onClick={() => void signOut()}>
              <Ic.ext />
            </button>
          )}
        </div>
      </aside>

      <div className="op-main">
        <header className="op-top">
          <button
            className="op-navtoggle"
            aria-label="Toggle navigation"
            onClick={() => setNavOpen((o) => !o)}
          >
            ☰
          </button>
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <span className="sep">/</span>}
                {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
              </span>
            ))}
          </div>
          <span className="spacer" />
          <span className="now">{nowStamp()}</span>
          <button
            className="search"
            onClick={() => window.dispatchEvent(new Event('tundra:search'))}
          >
            <Ic.search />
            <span>Search…</span>
            <kbd>⌘K</kbd>
          </button>
        </header>

        <div className="op-content">
          <Outlet />
        </div>
      </div>

      {navOpen && <div className="op-navbackdrop" onClick={() => setNavOpen(false)} />}
      <CommandPalette />
      <Onboarding />
    </div>
  );
}
