import { useState, type FormEvent } from 'react';
import { useSession } from './AuthContext';
import { Ic, initials } from '../ui/ops';

/** Per-role presentation for the workspace picker. */
const ROLE: Record<string, { icon: keyof typeof Ic; label: string; scope: string }> = {
  ADMIN: {
    icon: 'settings',
    label: 'Admin',
    scope: 'Full access — every module, every record across the agency.',
  },
  RECRUITER: {
    icon: 'prospects',
    label: 'Recruiter',
    scope: 'Scoped to assigned athletes and their recruiting pipeline.',
  },
  ATHLETE: {
    icon: 'athletes',
    label: 'Athlete',
    scope: 'Personal portal — own deals, payments and compliance only.',
  },
};

/**
 * Split sign-in screen — branded panel + workspace picker.
 *  - mock auth → role-card picker (one click to enter)
 *  - real auth → email / password form
 */
export function LoginView() {
  const { signIn, authMode, availableUsers } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  function submitForm(e: FormEvent) {
    e.preventDefault();
    void run(() => signIn(email, password));
  }

  return (
    <div className="op-auth">
      <aside className="op-auth-brand">
        <img className="op-auth-logo" src="/logo.png" alt="Tundra Sports" />
        <div className="op-auth-tag">
          The operating system for a <em>football agency</em>.
        </div>
        <p className="op-auth-lede">
          Athletes, NIL deals, payments, compliance and recruiting — one calm,
          high-trust workspace for Tundra Sports Group.
        </p>
        <div className="op-auth-points">
          <div>
            <div className="pv">9</div>
            <div className="pl">Modules</div>
          </div>
          <div>
            <div className="pv">3</div>
            <div className="pl">Roles</div>
          </div>
          <div>
            <div className="pv">RBAC</div>
            <div className="pl">Scoped data</div>
          </div>
        </div>
      </aside>

      <main className="op-auth-main">
        {authMode === 'mock' ? (
          <>
            <h1>Choose a workspace</h1>
            <p className="sub">
              Demo environment — pick a role to enter. Live RBAC scopes every
              screen to the account you choose.
            </p>
            <div className="op-auth-grid">
              {availableUsers.map((u) => {
                const role = ROLE[u.role] ?? ROLE.ADMIN;
                const RoleIcon = Ic[role.icon];
                return (
                  <button
                    key={u.id}
                    className="op-role-card"
                    disabled={busy}
                    onClick={() => void run(() => signIn(u.email ?? '', ''))}
                  >
                    <span className="rc-top">
                      <span className="rc-ico">
                        <RoleIcon width={16} height={16} />
                      </span>
                      <span className="op-pill blue">{role.label}</span>
                    </span>
                    <span className="rc-avo">{initials(u.name)}</span>
                    <span className="rc-name">{u.name}</span>
                    <span className="rc-scope">{role.scope}</span>
                    <span className="rc-go">Enter workspace →</span>
                  </button>
                );
              })}
            </div>
            {error && <div className="op-auth-err">{error}</div>}
          </>
        ) : (
          <form className="op-auth-form" onSubmit={submitForm}>
            <h1>Sign in</h1>
            <p className="sub">Internal platform — Tundra Sports Group.</p>
            <div className="op-field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tundra.dev"
              />
            </div>
            <div className="op-field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="op-auth-err">{error}</div>}
            <button
              className="op-btn op-btn-primary"
              style={{ height: 36, marginTop: 8 }}
              disabled={busy || !email || !password}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
        <div className="op-auth-foot">Tundra Hub · v1.0 · internal operations</div>
      </main>
    </div>
  );
}
