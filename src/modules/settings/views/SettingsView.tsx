import { PageHeader } from '../../../ui';
import { useAuth } from '../../../auth/AuthContext';
import { ACTIVE_BACKEND } from '../../../services';
import { ENV } from '../../../config/env';
import { CAPABILITIES, ALL_RESOURCES, type Role } from '../../../rbac';

const ROLES: Role[] = ['ADMIN', 'RECRUITER', 'ATHLETE'];

/** Access tier label from an action-count. */
function tier(actionCount: number): string {
  if (actionCount >= 4) return 'Full';
  if (actionCount >= 3) return 'Write';
  if (actionCount >= 1) return 'Read';
  return '—';
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="kv">
      <div className="kv-k">{k}</div>
      <div className="kv-v">{v}</div>
    </div>
  );
}

/**
 * Settings — workspace configuration and the live RBAC access policy.
 * Read-only in V1 (no settings persistence layer yet).
 */
export function SettingsView() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Workspace configuration and access policy."
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Your Profile</h3>
          <div className="kv-grid">
            <Kv k="Name" v={user.name} />
            <Kv k="Role" v={user.role} />
            <Kv k="User ID" v={user.id} />
            <Kv
              k="Scope"
              v={
                user.role === 'ADMIN'
                  ? 'All records'
                  : user.role === 'RECRUITER'
                    ? `Recruiter ${user.recruiterId ?? '—'}`
                    : `Athlete ${user.athleteId ?? '—'}`
              }
            />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Workspace</h3>
          <div className="kv-grid">
            <Kv k="Organisation" v="Tundra Sports Group" />
            <Kv k="Product" v="Tundra Sports Hub" />
            <Kv k="Data Source" v={ACTIVE_BACKEND} />
            <Kv k="Debug Logging" v={ENV.debug ? 'On' : 'Off'} />
            <Kv k="Build" v={ENV.isProduction ? 'Production' : 'Development'} />
            <Kv k="Version" v="V1" />
          </div>
        </div>
      </div>

      <div className="section-title">Access Policy — RBAC</div>
      <div className="card">
        <table className="matrix">
          <thead>
            <tr>
              <th>Resource</th>
              {ROLES.map((r) => (
                <th key={r}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_RESOURCES.map((resource) => (
              <tr key={resource}>
                <td>{resource}</td>
                {ROLES.map((role) => {
                  const label = tier(CAPABILITIES[role][resource].length);
                  return (
                    <td key={role} className={label === '—' ? 'cross' : 'tick'}>
                      {label}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
        Settings are read-only in V1. Identity comes from the demo switcher
        — a real auth provider (Clerk / Supabase) would supply it in
        production, and the RBAC policy above would also be enforced
        server-side.
      </p>
    </div>
  );
}
