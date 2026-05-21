import { useState, type FormEvent } from 'react';
import { useSession } from './AuthContext';

/**
 * Split sign-in screen — branded panel + entry.
 *  - mock auth  → one-click demo account picker
 *  - real auth  → email / password form
 * Shown by <AuthGate> while the session is anonymous.
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
    <div className="auth-split">
      <aside className="auth-brand">
        <div className="auth-brandmark">
          <img className="auth-logo" src="/logo.svg" alt="Tundra Sports" />
          <div>
            <div className="brand-name">Tundra Sports</div>
            <div className="brand-sub">Hub</div>
          </div>
        </div>

        <div className="auth-tag">
          The operating system for a <em>football agency</em>.
        </div>
        <p className="auth-lede">
          Athletes, NIL deals, payments, compliance and recruiting — one
          high-trust workspace for Tundra Sports Group.
        </p>

        <div className="auth-stats">
          <div className="auth-stat">
            <div className="n">8</div>
            <div className="l">Modules</div>
          </div>
          <div className="auth-stat">
            <div className="n">3</div>
            <div className="l">Access tiers</div>
          </div>
          <div className="auth-stat">
            <div className="n">RBAC</div>
            <div className="l">Scoped data</div>
          </div>
        </div>
      </aside>

      <main className="auth-form">
        {authMode === 'mock' ? (
          <>
            <h2>Choose a workspace</h2>
            <p className="sub">
              Demo environment — pick a role to enter. Live RBAC scopes
              every screen to the account.
            </p>
            <div className="account-list">
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  className="account"
                  disabled={busy}
                  onClick={() => void run(() => signIn(u.email ?? '', ''))}
                >
                  <span className="avatar">{u.name.charAt(0)}</span>
                  <span>
                    <span className="a-name">{u.name}</span>
                    <span className="a-role">{u.role}</span>
                  </span>
                  <span className="a-go">→</span>
                </button>
              ))}
            </div>
            {error && <div className="inline-error">{error}</div>}
          </>
        ) : (
          <form onSubmit={submitForm}>
            <h2>Sign in</h2>
            <p className="sub">Internal platform — Tundra Sports Group.</p>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tundra.dev"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="inline-error">{error}</div>}
            <button
              className="btn btn-primary"
              disabled={busy || !email || !password}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
