import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataService } from '../services';
import { useAuth } from '../auth/AuthContext';
import { Ic } from '../ui/ops';

interface Hit {
  key: string;
  kind: 'ath' | 'pro' | 'deal' | 'pay' | 'task';
  label: string;
  sub: string;
  to: string;
}

const KIND_ICON: Record<Hit['kind'], keyof typeof Ic> = {
  ath: 'athletes',
  pro: 'prospects',
  deal: 'deals',
  pay: 'payments',
  task: 'tasks',
};

/**
 * Global command palette — ⌘K / Ctrl-K (or the topbar search) opens a
 * search across every entity the user can see. RBAC-scoped via the
 * scoped data service.
 */
export function CommandPalette() {
  const service = useDataService();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<Hit[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    function onTrigger() {
      setOpen(true);
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('tundra:search', onTrigger);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('tundra:search', onTrigger);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const [athletes, prospects, deals, payments, tasks] = await Promise.all([
        service.athletes.getAll(),
        service.prospects.getAll(),
        service.deals.getAll(),
        service.payments.getAll(),
        service.tasks.getAll(),
      ]);
      const name = new Map(athletes.map((a) => [a.id, a.name]));
      const hits: Hit[] = [
        ...athletes.map<Hit>((a) => ({
          key: `ath-${a.id}`,
          kind: 'ath',
          label: a.name,
          sub: `Athlete · ${a.stats.sport}`,
          to: `/athletes/${a.id}`,
        })),
        ...prospects.map<Hit>((p) => ({
          key: `pro-${p.id}`,
          kind: 'pro',
          label: p.name,
          sub: `Prospect · ${p.stage}`,
          to: `/prospects?focus=${p.id}`,
        })),
        ...deals.map<Hit>((d) => ({
          key: `deal-${d.id}`,
          kind: 'deal',
          label: `${name.get(d.athleteId) ?? d.athleteId} — NIL deal`,
          sub: `Deal · ${d.status}`,
          to: `/deals/${d.id}`,
        })),
        ...payments.map<Hit>((p) => ({
          key: `pay-${p.id}`,
          kind: 'pay',
          label: `INV-${p.id.toUpperCase()}`,
          sub: `Payment · ${name.get(p.athleteId) ?? p.athleteId}`,
          to: `/payments?focus=${p.id}`,
        })),
        ...tasks.map<Hit>((t) => ({
          key: `task-${t.id}`,
          kind: 'task',
          label: t.title,
          sub: `Task · ${t.status.replace('_', ' ')}`,
          to: `/tasks?focus=${t.id}`,
        })),
      ];
      if (!cancelled) setIndex(hits);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, service, user]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 8);
    return index
      .filter((h) => h.label.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, index]);

  if (!open) return null;

  function go(to: string) {
    setOpen(false);
    setQuery('');
    navigate(to);
  }

  return (
    <div className="op-cmdk-backdrop" onClick={() => setOpen(false)}>
      <div className="op-cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="op-cmdk-input">
          <Ic.search />
          <input
            autoFocus
            placeholder="Search athletes, deals, payments, tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="op-kbd">ESC</span>
        </div>
        <div className="op-cmdk-results">
          {results.length === 0 ? (
            <div className="op-cmdk-empty">No matches.</div>
          ) : (
            <>
              <div className="op-cmdk-sec">Results · {results.length}</div>
              {results.map((h) => {
                const Icon = Ic[KIND_ICON[h.kind]];
                return (
                  <button className="op-cmdk-row" key={h.key} onClick={() => go(h.to)}>
                    <span className="ico">
                      <Icon />
                    </span>
                    <span>
                      <span className="label">{h.label}</span>
                      <span className="sub">{h.sub}</span>
                    </span>
                    <Ic.chev />
                  </button>
                );
              })}
            </>
          )}
        </div>
        <div className="op-cmdk-foot">
          <span>↵ open</span>
          <span>esc close</span>
          <span style={{ marginLeft: 'auto' }}>Tundra Hub</span>
        </div>
      </div>
    </div>
  );
}
