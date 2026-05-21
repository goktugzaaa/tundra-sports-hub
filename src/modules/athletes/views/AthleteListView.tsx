import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AsyncBoundary, Modal, Field } from '../../../ui';
import { Ic, StatusTag, initials, type OpTone } from '../../../ui/ops';
import { recruiterName, DEMO_USERS } from '../../../auth/users';
import { useAuth } from '../../../auth/AuthContext';
import type { Athlete, AthleteStatus } from '../../../domain';
import { useAthletes } from '../hooks/useAthletes';

const PAGE_SIZE = 12;
const STATUSES: AthleteStatus[] = ['active', 'injured', 'inactive', 'retired'];
const RECRUITERS = DEMO_USERS.filter((u) => u.role === 'RECRUITER');

const STATUS_TONE: Record<AthleteStatus, OpTone> = {
  active: 'ok',
  injured: 'alert',
  inactive: '',
  retired: '',
};

/**
 * Athletes — table-first operator surface. Dense data table, quiet filter
 * bar, right-side drawer for the selected record. RBAC-scoped upstream.
 */
export function AthleteListView() {
  const { data, loading, error, reload, canCreate, create, saving, saveError } = useAthletes();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | AthleteStatus>('all');
  const [recruiter, setRecruiter] = useState<'all' | string>('all');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  // New-athlete form
  const [showNew, setShowNew] = useState(false);
  const recruiterLocked = user.role === 'RECRUITER';
  const [fName, setFName] = useState('');
  const [fStatus, setFStatus] = useState<AthleteStatus>('active');
  const [fRecruiter, setFRecruiter] = useState(
    user.recruiterId ?? RECRUITERS[0]?.recruiterId ?? '',
  );
  const [fSport, setFSport] = useState('Football');
  const [fPosition, setFPosition] = useState('');

  const list = data ?? [];

  const counts = useMemo(() => {
    const c = { active: 0, injured: 0, inactive: 0, retired: 0 } as Record<AthleteStatus, number>;
    for (const a of list) c[a.status]++;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q) && !a.stats.sport.toLowerCase().includes(q))
        return false;
      if (status !== 'all' && a.status !== status) return false;
      if (recruiter !== 'all' && a.recruiterId !== recruiter) return false;
      return true;
    });
  }, [list, search, status, recruiter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const open = openId ? list.find((a) => a.id === openId) ?? null : null;

  function resetTo<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  async function submitNew() {
    if (!fName.trim() || !fRecruiter) return;
    const payload: Omit<Athlete, 'id'> = {
      name: fName.trim(),
      status: fStatus,
      recruiterId: recruiterLocked ? (user.recruiterId as string) : fRecruiter,
      stats: {
        sport: fSport.trim() || 'Football',
        position: fPosition.trim() || undefined,
        season: '2025-26',
        metrics: {},
      },
      metadata: {},
    };
    const done = await create(payload);
    if (done) {
      setShowNew(false);
      setFName('');
      setFPosition('');
    }
  }

  const recruiterOptions = useMemo(() => [...new Set(list.map((a) => a.recruiterId))], [list]);

  return (
    <div className="op-tablepage">
      <div className="op-tp-head">
        <div className="head">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1>Athletes</h1>
            <span className="subtle">
              {filtered.length} of {list.length} shown
            </span>
          </div>
          <div className="actions">
            <button className="op-btn">
              <Ic.download /> Export
            </button>
            <button
              className="op-btn op-btn-primary"
              disabled={!canCreate}
              onClick={() => setShowNew(true)}
            >
              <Ic.plus /> Add athlete
            </button>
          </div>
        </div>

      </div>

      <div className="op-views">
        <button
          className={'view' + (status === 'all' ? ' active' : '')}
          onClick={() => resetTo(setStatus)('all')}
        >
          All athletes <span className="c">{list.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={'view' + (status === s ? ' active' : '')}
            onClick={() => resetTo(setStatus)(s)}
          >
            {s[0].toUpperCase() + s.slice(1)} <span className="c">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="op-tablebar">
        <div className="search">
          <Ic.search />
          <input
            placeholder="Search by name or sport…"
            value={search}
            onChange={(e) => resetTo(setSearch)(e.target.value)}
          />
        </div>
        <select
          className="filter"
          style={{ background: 'var(--surface)' }}
          value={recruiter}
          onChange={(e) => resetTo(setRecruiter)(e.target.value)}
        >
          <option value="all">Recruiter · All</option>
          {recruiterOptions.map((r) => (
            <option key={r} value={r}>
              {recruiterName(r)}
            </option>
          ))}
        </select>
        <span className="gap" />
        <span className="results">{filtered.length} results</span>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && list.length === 0}
        emptyText="No athletes visible to your role."
      >
        <div className="op-tp-scroll">
          <table className="op-dtable">
            <thead>
              <tr>
                <th style={{ width: 26 }}>#</th>
                <th style={{ width: 26 }} />
                <th className="sortable asc">Athlete</th>
                <th>ID</th>
                <th>Sport · pos</th>
                <th>Status</th>
                <th>Recruiter</th>
                <th>Season</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="dim" style={{ textAlign: 'center', padding: 28 }}>
                    No athletes match these filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((a, i) => (
                  <tr
                    key={a.id}
                    className={openId === a.id ? 'open' : a.status === 'injured' ? 'alert' : ''}
                    onClick={() => setOpenId(a.id)}
                  >
                    <td className="dim mono">{safePage * PAGE_SIZE + i + 1}</td>
                    <td>
                      <span className="op-avo">{initials(a.name)}</span>
                    </td>
                    <td className="strong">{a.name}</td>
                    <td>
                      <span className="id">{a.id.toUpperCase()}</span>
                    </td>
                    <td>
                      {a.stats.sport}
                      {a.stats.position ? ` · ${a.stats.position}` : ''}
                    </td>
                    <td>
                      <StatusTag tone={STATUS_TONE[a.status]} label={a.status} />
                    </td>
                    <td>{recruiterName(a.recruiterId)}</td>
                    <td className="mono dim">{a.stats.season ?? '—'}</td>
                    <td>
                      <button
                        className="op-iconbtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenId(a.id);
                        }}
                      >
                        <Ic.more />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      <div className="op-tablefoot" style={{ margin: '0 22px' }}>
        <span>
          Showing {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
          {Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of {filtered.length}
        </span>
        <span className="pager">
          <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            ‹
          </button>
          {Array.from({ length: pageCount }).map((_, p) => (
            <button
              key={p}
              className={p === safePage ? 'active' : ''}
              onClick={() => setPage(p)}
            >
              {p + 1}
            </button>
          ))}
          <button
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            ›
          </button>
          <span style={{ marginLeft: 8 }}>{PAGE_SIZE} per page</span>
        </span>
      </div>

      {open && <AthleteDrawer athlete={open} onClose={() => setOpenId(null)} />}

      {showNew && (
        <Modal title="Add athlete" onClose={() => setShowNew(false)}>
          <Field label="Full name">
            <input
              autoFocus
              value={fName}
              placeholder="e.g. Owen Carter"
              onChange={(e) => setFName(e.target.value)}
            />
          </Field>
          <Field label="Recruiter">
            <select
              value={recruiterLocked ? (user.recruiterId as string) : fRecruiter}
              disabled={recruiterLocked}
              onChange={(e) => setFRecruiter(e.target.value)}
            >
              {RECRUITERS.map((r) => (
                <option key={r.recruiterId} value={r.recruiterId}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value as AthleteStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sport">
            <input value={fSport} onChange={(e) => setFSport(e.target.value)} />
          </Field>
          <Field label="Position">
            <input
              value={fPosition}
              placeholder="e.g. Striker"
              onChange={(e) => setFPosition(e.target.value)}
            />
          </Field>
          {saveError && <div className="op-inline-error">{saveError}</div>}
          <button
            className="op-btn op-btn-primary"
            style={{ height: 30, marginTop: 4 }}
            disabled={saving || !fName.trim()}
            onClick={submitNew}
          >
            {saving ? 'Creating…' : 'Create athlete'}
          </button>
        </Modal>
      )}
    </div>
  );
}

/** Right-side record drawer for the selected athlete. */
function AthleteDrawer({ athlete, onClose }: { athlete: Athlete; onClose: () => void }) {
  const metrics = Object.entries(athlete.stats.metrics);
  return (
    <div className="op-drawer-wrap">
      <div className="op-drawer-scrim" onClick={onClose} />
      <aside className="op-drawer">
        <header className="op-drawer-head">
          <div className="avo">{initials(athlete.name)}</div>
          <div className="title">
            <div className="name">{athlete.name}</div>
            <div className="id">
              {athlete.id.toUpperCase()} · {athlete.stats.sport}
              {athlete.stats.position ? ` · ${athlete.stats.position}` : ''}
            </div>
          </div>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="op-drawer-actions">
          <Link to={`/athletes/${athlete.id}`} className="op-btn">
            <Ic.ext /> Full record
          </Link>
          <button className="op-btn">
            <Ic.upload /> Upload
          </button>
          <span className="spacer" />
          <Link to={`/athletes/${athlete.id}`} className="op-btn op-btn-primary">
            Edit
          </Link>
        </div>

        <div className="op-drawer-body">
          <div className="op-drawer-section">
            <div className="ds-head">
              <h4>Identity</h4>
              <span className="meta">{athlete.id.toUpperCase()}</span>
            </div>
            <div className="op-drawer-kv">
              <div>
                <div className="k">Status</div>
                <div className="v">{athlete.status}</div>
              </div>
              <div>
                <div className="k">Sport</div>
                <div className="v">{athlete.stats.sport}</div>
              </div>
              <div>
                <div className="k">Position</div>
                <div className="v">{athlete.stats.position ?? '—'}</div>
              </div>
              <div>
                <div className="k">Season</div>
                <div className="v">{athlete.stats.season ?? '—'}</div>
              </div>
              <div>
                <div className="k">Recruiter</div>
                <div className="v">{recruiterName(athlete.recruiterId)}</div>
              </div>
            </div>
          </div>

          {metrics.length > 0 && (
            <div className="op-drawer-section">
              <div className="ds-head">
                <h4>Performance metrics</h4>
                <span className="meta">{metrics.length} tracked</span>
              </div>
              <div className="op-drawer-kv">
                {metrics.map(([k, v]) => (
                  <div key={k}>
                    <div className="k">{k}</div>
                    <div className="v">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="op-drawer-foot">
          <span>record {athlete.id.toUpperCase()}</span>
          <span className="spacer" />
          <Link to={`/athletes/${athlete.id}`} className="op-btn-link">
            Open full record →
          </Link>
        </footer>
      </aside>
    </div>
  );
}

