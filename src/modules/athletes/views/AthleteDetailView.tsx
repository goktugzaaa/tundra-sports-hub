import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  PageHeader,
  AsyncBoundary,
  StatCard,
  CardSkeleton,
  StatusBadge,
  Modal,
  Field,
} from '../../../ui';
import { recruiterName } from '../../../auth/users';
import { formatMoney, formatMoneyCompact } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import type { AthleteStatus } from '../../../domain';
import { useAthleteDetail } from '../hooks/useAthleteDetail';

const STATUSES: AthleteStatus[] = ['active', 'injured', 'inactive', 'retired'];

/** Athlete detail — profile header, stats, financial summary, deals, edit. */
export function AthleteDetailView() {
  const { id = '' } = useParams();
  const { data, loading, error, reload, canEdit, save, saving, saveError } =
    useAthleteDetail(id);

  const [editing, setEditing] = useState(false);
  const [fName, setFName] = useState('');
  const [fStatus, setFStatus] = useState<AthleteStatus>('active');
  const [fPosition, setFPosition] = useState('');

  function openEdit() {
    if (!data) return;
    setFName(data.athlete.name);
    setFStatus(data.athlete.status);
    setFPosition(data.athlete.stats.position ?? '');
    setEditing(true);
  }

  async function submitEdit() {
    if (!data || !fName.trim()) return;
    const done = await save({
      name: fName.trim(),
      status: fStatus,
      stats: { ...data.athlete.stats, position: fPosition.trim() || undefined },
    });
    if (done) setEditing(false);
  }

  return (
    <div>
      <PageHeader
        title={data ? data.athlete.name : 'Athlete'}
        subtitle={
          data
            ? `${data.athlete.stats.sport} · ${data.athlete.stats.position ?? '—'}`
            : 'Athlete profile'
        }
        actions={
          <>
            <Link className="btn" to="/athletes">
              ← Back
            </Link>{' '}
            <button
              className="btn btn-primary"
              disabled={!canEdit || !data}
              onClick={openEdit}
            >
              Edit
            </button>
          </>
        }
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<CardSkeleton count={3} />}
      >
        {data && (
          <>
            {/* Financial summary */}
            <div className="grid grid-3">
              <StatCard
                label="Total Revenue"
                value={formatMoney({ amount: data.totalRevenue, currency: 'USD' })}
              />
              <StatCard
                label="Outstanding"
                value={formatMoney({ amount: data.outstanding, currency: 'USD' })}
              />
              <StatCard label="Assigned Deals" value={data.assignedDeals.length} />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
              {/* Profile */}
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Profile</h3>
                <div className="detail-row">
                  <span className="k">Status</span>
                  <StatusBadge kind="athlete" value={data.athlete.status} />
                </div>
                <div className="detail-row">
                  <span className="k">Competing</span>
                  <span>{data.isActive ? 'Yes' : 'No'}</span>
                </div>
                <div className="detail-row">
                  <span className="k">Recruiter</span>
                  <span>{recruiterName(data.athlete.recruiterId)}</span>
                </div>
                <div className="detail-row">
                  <span className="k">Season</span>
                  <span>{data.athlete.stats.season ?? '—'}</span>
                </div>
              </div>

              {/* Stats overview */}
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Performance Metrics</h3>
                {Object.entries(data.athlete.stats.metrics).map(([k, v]) => (
                  <div className="detail-row" key={k}>
                    <span className="k">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned deals */}
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 12 }}>Assigned Deals</h3>
              {data.assignedDeals.length === 0 ? (
                <div className="state-box">No deals for this athlete.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assignedDeals.map((d) => (
                      <tr key={d.id}>
                        <td>{formatMoneyCompact(d.value)}</td>
                        <td>
                          <StatusBadge kind="deal" value={d.status} />
                        </td>
                        <td>
                          {formatDate(d.startDate)} → {formatDate(d.endDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </AsyncBoundary>

      {editing && data && (
        <Modal title={`Edit — ${data.athlete.name}`} onClose={() => setEditing(false)}>
          <Field label="Full name">
            <input value={fName} onChange={(e) => setFName(e.target.value)} />
          </Field>
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
          <Field label="Position">
            <input value={fPosition} onChange={(e) => setFPosition(e.target.value)} />
          </Field>
          {saveError && <div className="inline-error">{saveError}</div>}
          <button
            className="btn btn-primary"
            disabled={saving || !fName.trim()}
            onClick={submitEdit}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </Modal>
      )}
    </div>
  );
}
