import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  AsyncBoundary,
  TableSkeleton,
  StatusBadge,
  Modal,
  Field,
} from '../../../ui';
import { recruiterName, DEMO_USERS } from '../../../auth/users';
import { useAuth } from '../../../auth/AuthContext';
import type { Athlete, AthleteStatus } from '../../../domain';
import { useAthletes } from '../hooks/useAthletes';

const PAGE_SIZE = 5;
const STATUSES: AthleteStatus[] = ['active', 'injured', 'inactive', 'retired'];
const RECRUITERS = DEMO_USERS.filter((u) => u.role === 'RECRUITER');

/**
 * Athlete CRM list — searchable, filterable, paginated, with create.
 * Search/filter/pagination are UI state; rows are RBAC-scoped upstream.
 */
export function AthleteListView() {
  const { data, loading, error, reload, canCreate, create, saving, saveError } =
    useAthletes();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | AthleteStatus>('all');
  const [recruiter, setRecruiter] = useState<'all' | string>('all');
  const [page, setPage] = useState(0);

  // ── New-athlete wizard state ──
  const [showNew, setShowNew] = useState(false);
  const [step, setStep] = useState(1);
  const [fName, setFName] = useState('');
  const [fStatus, setFStatus] = useState<AthleteStatus>('active');
  const [fRecruiter, setFRecruiter] = useState(user.recruiterId ?? RECRUITERS[0]?.recruiterId ?? '');
  const [fSport, setFSport] = useState('Football');
  const [fPosition, setFPosition] = useState('');

  const recruiterOptions = useMemo(
    () => [...new Set((data ?? []).map((a) => a.recruiterId))],
    [data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((a) => {
      if (q && !a.name.toLowerCase().includes(q)) return false;
      if (status !== 'all' && a.status !== status) return false;
      if (recruiter !== 'all' && a.recruiterId !== recruiter) return false;
      return true;
    });
  }, [data, search, status, recruiter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
    };
  }

  const recruiterLocked = user.role === 'RECRUITER';

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

  return (
    <div>
      <PageHeader
        title="Athletes"
        subtitle="Client roster — scoped to your role and assignments."
        actions={
          <button
            className="btn btn-primary"
            disabled={!canCreate}
            onClick={() => {
              setStep(1);
              setShowNew(true);
            }}
          >
            + New Athlete
          </button>
        }
      />

      <div className="filter-bar">
        <input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => resetPage(setSearch)(e.target.value)}
        />
        <span className="filter-label">Status</span>
        <select
          value={status}
          onChange={(e) => resetPage(setStatus)(e.target.value as 'all' | AthleteStatus)}
        >
          <option value="all">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="filter-label">Recruiter</span>
        <select value={recruiter} onChange={(e) => resetPage(setRecruiter)(e.target.value)}>
          <option value="all">All</option>
          {recruiterOptions.map((r) => (
            <option key={r} value={r}>
              {recruiterName(r)}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={reload}
          skeleton={<TableSkeleton rows={PAGE_SIZE} cols={5} />}
          isEmpty={filtered.length === 0}
          emptyText={
            (data ?? []).length === 0
              ? 'No athletes visible to your role.'
              : 'No athletes match these filters.'
          }
        >
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Sport</th>
                <th>Recruiter</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.stats.sport}</td>
                  <td>{recruiterName(a.recruiterId)}</td>
                  <td>
                    <StatusBadge kind="athlete" value={a.status} />
                  </td>
                  <td>
                    <Link className="link" to={`/athletes/${a.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <span>
              {filtered.length} athlete{filtered.length === 1 ? '' : 's'}
            </span>
            <div className="pager">
              <button
                className="btn"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              >
                Prev
              </button>
              <span>
                Page {safePage + 1} / {pageCount}
              </span>
              <button
                className="btn"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </AsyncBoundary>
      </div>

      {showNew && (
        <Modal title="New Athlete" onClose={() => setShowNew(false)}>
          <div className="wizard-steps">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={'wstep' + (s === step ? ' active' : s < step ? ' done' : '')}
              />
            ))}
            <span className="wstep-label">
              Step {step} of 3 ·{' '}
              {step === 1 ? 'Identity' : step === 2 ? 'Profile' : 'Review'}
            </span>
          </div>

          {step === 1 && (
            <>
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
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Status">
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value as AthleteStatus)}
                >
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
            </>
          )}

          {step === 3 && (
            <div>
              <div className="detail-row">
                <span className="k">Name</span>
                <span>{fName || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="k">Recruiter</span>
                <span>
                  {recruiterName(recruiterLocked ? (user.recruiterId as string) : fRecruiter)}
                </span>
              </div>
              <div className="detail-row">
                <span className="k">Status</span>
                <span>{fStatus}</span>
              </div>
              <div className="detail-row">
                <span className="k">Sport</span>
                <span>{fSport}</span>
              </div>
              <div className="detail-row">
                <span className="k">Position</span>
                <span>{fPosition || '—'}</span>
              </div>
            </div>
          )}

          {saveError && <div className="inline-error">{saveError}</div>}

          <div className="wizard-actions">
            {step > 1 && (
              <button className="btn" onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {step < 3 && (
                <button
                  className="btn btn-primary"
                  disabled={step === 1 && !fName.trim()}
                  onClick={() => setStep(step + 1)}
                >
                  Next →
                </button>
              )}
              {step === 3 && (
                <button
                  className="btn btn-primary"
                  disabled={saving || !fName.trim()}
                  onClick={submitNew}
                >
                  {saving ? 'Creating…' : 'Create Athlete'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
