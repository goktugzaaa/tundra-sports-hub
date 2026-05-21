import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataService } from '../services';
import { useAuth } from '../auth/AuthContext';

interface Hit {
  key: string;
  label: string;
  sub: string;
  to: string;
}

/**
 * Global command palette — ⌘K / Ctrl-K (or the topbar search button)
 * opens a search across every entity the user can see. Results are
 * RBAC-scoped because they come through the scoped data service.
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
        ...athletes.map((a) => ({
          key: `ath-${a.id}`,
          label: a.name,
          sub: `Athlete · ${a.stats.sport}`,
          to: `/athletes/${a.id}`,
        })),
        ...prospects.map((p) => ({
          key: `pro-${p.id}`,
          label: p.name,
          sub: `Prospect · ${p.stage}`,
          to: `/prospects?focus=${p.id}`,
        })),
        ...deals.map((d) => ({
          key: `deal-${d.id}`,
          label: `${name.get(d.athleteId) ?? d.athleteId} — NIL deal`,
          sub: `Deal · ${d.status}`,
          to: `/deals/${d.id}`,
        })),
        ...payments.map((p) => ({
          key: `pay-${p.id}`,
          label: `INV-${p.id.toUpperCase()}`,
          sub: `Payment · ${name.get(p.athleteId) ?? p.athleteId}`,
          to: `/payments?focus=${p.id}`,
        })),
        ...tasks.map((t) => ({
          key: `task-${t.id}`,
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
    <div className="cmdk-backdrop" onClick={() => setOpen(false)}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="cmdk-input"
          placeholder="Search athletes, deals, payments, tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="cmdk-results">
          {results.length === 0 ? (
            <div className="cmdk-empty">No matches.</div>
          ) : (
            results.map((h) => (
              <button className="cmdk-row" key={h.key} onClick={() => go(h.to)}>
                <span className="cmdk-label">{h.label}</span>
                <span className="cmdk-sub">{h.sub}</span>
              </button>
            ))
          )}
        </div>
        <div className="cmdk-hint">Esc to close</div>
      </div>
    </div>
  );
}
