import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AsyncBoundary, Modal, Field } from '../../../ui';
import { StatusTag, type OpTone } from '../../../ui/ops';
import { recruiterName } from '../../../auth/users';
import { formatMoney, formatMoneyCompact } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import type { AthleteStatus, DealStatus } from '../../../domain';
import { useAthleteDetail } from '../hooks/useAthleteDetail';

const STATUSES: AthleteStatus[] = ['active', 'injured', 'inactive', 'retired'];

const DEAL_TONE: Record<DealStatus, OpTone> = {
  negotiation: 'warn',
  signed: 'blue',
  active: 'ok',
  closed: '',
};

/** Athlete record — operator detail view: header, contract, metrics, deals. */
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
    <div className="op-detail">
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="d-head">
              <div>
                <div className="id">
                  {data.athlete.id.toUpperCase()} · {data.athlete.stats.sport}
                </div>
                <div className="name">{data.athlete.name}</div>
                <div className="tags">
                  <StatusTag
                    tone={data.athlete.status === 'active' ? 'ok' : data.athlete.status === 'injured' ? 'alert' : ''}
                    label={data.athlete.status}
                  />
                  <span className="sep">·</span>
                  <span>{data.athlete.stats.position ?? 'Position —'}</span>
                  <span className="sep">·</span>
                  <span>Season {data.athlete.stats.season ?? '—'}</span>
                  <span className="sep">·</span>
                  <span>Agent: {recruiterName(data.athlete.recruiterId)}</span>
                </div>
              </div>
              <div className="actions">
                <Link className="op-btn" to="/athletes">
                  ‹ Athletes
                </Link>
                <button
                  className="op-btn op-btn-primary"
                  disabled={!canEdit}
                  onClick={openEdit}
                >
                  Edit
                </button>
              </div>
            </div>

            <div
              className="op-summary"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 4 }}
            >
              <div>
                <div className="l">Total revenue</div>
                <div className="v">
                  {formatMoney({ amount: data.totalRevenue, currency: 'USD' })}
                </div>
                <div className="s">Settled across deals</div>
              </div>
              <div>
                <div className="l">Outstanding</div>
                <div className={'v' + (data.outstanding > 0 ? ' warn' : '')}>
                  {formatMoney({ amount: data.outstanding, currency: 'USD' })}
                </div>
                <div className="s">Pending + overdue</div>
              </div>
              <div>
                <div className="l">Assigned deals</div>
                <div className="v">{data.assignedDeals.length}</div>
                <div className="s">{data.isActive ? 'Currently competing' : 'Not competing'}</div>
              </div>
            </div>

            <div className="op-h">
              <h3>Profile</h3>
              <div className="h-meta">athlete record</div>
            </div>
            <div className="op-kv-grid">
              <Kv k="Status" v={data.athlete.status} />
              <Kv k="Sport" v={data.athlete.stats.sport} />
              <Kv k="Position" v={data.athlete.stats.position ?? '—'} />
              <Kv k="Season" v={data.athlete.stats.season ?? '—'} />
              <Kv k="Recruiter" v={recruiterName(data.athlete.recruiterId)} />
              <Kv k="Competing" v={data.isActive ? 'Yes' : 'No'} />
            </div>

            {Object.keys(data.athlete.stats.metrics).length > 0 && (
              <>
                <div className="op-h">
                  <h3>Performance metrics</h3>
                  <div className="h-meta">{data.athlete.stats.season ?? 'season'}</div>
                </div>
                <div className="op-kv-grid">
                  {Object.entries(data.athlete.stats.metrics).map(([k, v]) => (
                    <Kv key={k} k={k} v={String(v)} />
                  ))}
                </div>
              </>
            )}

            <div className="op-h">
              <h3>Assigned deals</h3>
              <div className="h-meta">
                <b>{data.assignedDeals.length}</b> total
              </div>
            </div>
            <div className="op-card" style={{ overflow: 'hidden' }}>
              {data.assignedDeals.length === 0 ? (
                <div className="op-state">
                  <span className="glyph">∅</span>
                  <span>No deals for this athlete.</span>
                </div>
              ) : (
                <table className="op-table">
                  <thead>
                    <tr>
                      <th>Deal</th>
                      <th>Status</th>
                      <th className="right">Value</th>
                      <th className="right">Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assignedDeals.map((d) => (
                      <tr key={d.id}>
                        <td className="strong mono">{d.id.toUpperCase()}</td>
                        <td>
                          <StatusTag tone={DEAL_TONE[d.status]} label={d.status} />
                        </td>
                        <td className="right strong num">{formatMoneyCompact(d.value)}</td>
                        <td className="right" style={{ fontFamily: 'var(--mono)' }}>
                          {formatDate(d.startDate)} → {formatDate(d.endDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="op-edit-trail">
              <span>
                Record <b>{data.athlete.id.toUpperCase()}</b>
              </span>
              <span>Recruiter {recruiterName(data.athlete.recruiterId)}</span>
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
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value as AthleteStatus)}>
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
          {saveError && <div className="op-inline-error">{saveError}</div>}
          <button
            className="op-btn op-btn-primary"
            style={{ height: 30, marginTop: 4 }}
            disabled={saving || !fName.trim()}
            onClick={submitEdit}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </Modal>
      )}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="op-kv">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
