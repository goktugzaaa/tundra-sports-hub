import { useState, type FormEvent } from 'react';
import { useSession } from './AuthContext';
import { initials } from '../ui/ops';
import type { User } from './types';

/** Role → portrait shown on the right edge when an account is hovered. */
const ROLE_PHOTO: Record<string, string> = {
  ADMIN:
    'https://images.unsplash.com/photo-1614786269829-d24616faf56d?auto=format&fit=crop&w=560&h=1120&q=80',
  RECRUITER:
    'https://images.unsplash.com/photo-1543269664-56d93c1b41a6?auto=format&fit=crop&w=560&h=1120&q=80',
  ATHLETE:
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=560&h=1120&q=80',
};

/**
 * Split sign-in screen.
 *  - mock auth → vertical account picker; hovering a row reveals a
 *    role portrait sliding in from the right edge of the brand panel.
 *  - real auth → email / password form.
 */
export function LoginView() {
  const { signIn, authMode, availableUsers } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState<User | null>(null);

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
      <main className="op-auth-picker">
        {authMode === 'mock' ? (
          <>
            <h1>Choose a workspace</h1>
            <p className="sub">
              Demo environment — pick a role to enter. Live RBAC scopes every
              screen to the account.
            </p>
            <div className="op-acct-list" onMouseLeave={() => setHover(null)}>
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  className="op-acct"
                  disabled={busy}
                  onMouseEnter={() => setHover(u)}
                  onFocus={() => setHover(u)}
                  onClick={() => void run(() => signIn(u.email ?? '', ''))}
                >
                  <span className="av">{initials(u.name)}</span>
                  <span className="meta">
                    <span className="an">{u.name}</span>
                    <span className="ar">{u.role}</span>
                  </span>
                  <span className="ag">→</span>
                </button>
              ))}
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
      </main>

      <aside className="op-auth-stage">
        <img className="op-stage-logo" src="/logo.png" alt="Tundra Sports" />
        <div className="op-stage-tag">
          The operating system for a <em>football agency</em>.
        </div>
        <p className="op-stage-lede">
          Athletes, NIL deals, payments, compliance and recruiting — one calm,
          high-trust workspace for Tundra Sports Group.
        </p>
        <div className="op-stage-points">
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

        <div className={'op-auth-photo' + (hover ? ' show' : '')}>
          {hover && (
            <img key={hover.role} src={ROLE_PHOTO[hover.role]} alt="" />
          )}
          <div className="cap">
            <div className="cn">{hover?.name ?? ''}</div>
            <div className="cr">{hover?.role ?? ''}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
