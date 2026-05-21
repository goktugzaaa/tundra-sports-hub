import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  AsyncBoundary,
  StatCard,
  TableSkeleton,
  StatusBadge,
  Modal,
  Field,
} from '../../../ui';
import { focusScroll, useFocusParam } from '../../../hooks/useFocusParam';
import { formatMoney, formatMoneyCompact } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { dealsDomain, dealRules, type Deal, type DealStatus } from '../../../domain';
import { useDeals } from '../hooks/useDeals';

const STATUSES: { status: DealStatus; label: string }[] = [
  { status: 'negotiation', label: 'Negotiation' },
  { status: 'signed', label: 'Signed' },
  { status: 'active', label: 'Active' },
  { status: 'closed', label: 'Closed' },
];

/**
 * NIL Deals — revenue summary, a clickable status rail, and an operable
 * contract list: deals advance through their lifecycle in place.
 */
export function DealBoardView() {
  const {
    data,
    loading,
    error,
    reload,
    canCreate,
    canEdit,
    create,
    changeStatus,
    movingId,
    saving,
    saveError,
  } = useDeals();

  const [filter, setFilter] = useState<DealStatus | 'all'>('all');
  const focus = useFocusParam();

  // New-deal form
  const [showNew, setShowNew] = useState(false);
  const [fAthlete, setFAthlete] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fStatus, setFStatus] = useState<DealStatus>('negotiation');
  const [fStart, setFStart] = useState('');
  const [fEnd, setFEnd] = useState('');
  const [fInstallments, setFInstallments] = useState('3');

  const deals = data?.deals ?? [];
  const athletes = data ? Object.entries(data.athleteName) : [];

  const byStatus = (s: DealStatus) => deals.filter((d) => d.status === s);
  const maxCount = Math.max(1, ...STATUSES.map((s) => byStatus(s.status).length));
  const visible = filter === 'all' ? deals : byStatus(filter);

  async function submitNew() {
    const amount = Number(fAmount);
    if (!fAthlete || !amount || !fStart || !fEnd) return;
    const payload: Omit<Deal, 'id'> = {
      athleteId: fAthlete,
      value: { amount, currency: 'USD' },
      status: fStatus,
      startDate: fStart,
      endDate: fEnd,
    };
    const done = await create(payload, Number(fInstallments) || 0);
    if (done) {
      setShowNew(false);
      setFAthlete('');
      setFAmount('');
      setFStart('');
      setFEnd('');
    }
  }

  return (
    <div className="op-legacy">
      <PageHeader
        title="NIL Deals"
        subtitle="NIL contract pipeline and revenue tracking"
        actions={
          <button
            className="btn btn-primary"
            disabled={!canCreate || !data}
            onClick={() => setShowNew(true)}
          >
            + New Deal
          </button>
        }
      />

      {saveError && <div className="inline-error">{saveError}</div>}

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<TableSkeleton rows={5} cols={4} />}
        isEmpty={!!data && deals.length === 0}
        emptyText="No deals visible to your role."
      >
        {data && (
          <>
            <div className="section-title">Revenue</div>
            <div className="grid grid-3">
              <StatCard
                label="Pipeline Value"
                value={formatMoney({
                  amount: dealsDomain.calculatePipelineValue(deals),
                  currency: 'USD',
                })}
                hint="Open (not closed) deals"
                accent
              />
              <StatCard
                label="Contracted Value"
                value={formatMoney({
                  amount: dealsDomain.getContractedValue(deals),
                  currency: 'USD',
                })}
                hint="Signed + active"
              />
              <StatCard
                label="Active Deals"
                value={dealsDomain.getActiveDeals(deals).length}
                hint="Currently generating revenue"
              />
            </div>

            <div className="section-title">Pipeline</div>
            <div
              className="pipeline-rail"
              style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
            >
              {STATUSES.map((s) => {
                const stageDeals = byStatus(s.status);
                const stageValue = stageDeals.reduce((sum, d) => sum + d.value.amount, 0);
                return (
                  <button
                    key={s.status}
                    className={'rail-stage' + (filter === s.status ? ' active' : '')}
                    onClick={() => setFilter(filter === s.status ? 'all' : s.status)}
                  >
                    <div className="rs-count">{stageDeals.length}</div>
                    <div className="rs-label">{s.label}</div>
                    <div className="rs-bar">
                      <i style={{ width: `${(stageDeals.length / maxCount) * 100}%` }} />
                    </div>
                    <div className="rs-sub">
                      {formatMoneyCompact({ amount: stageValue, currency: 'USD' })}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rail-meta">
              <span>
                {visible.length} contract{visible.length === 1 ? '' : 's'}
                {filter === 'all' ? '' : ` · ${filter}`}
              </span>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')}>Clear filter</button>
              )}
            </div>

            <div className="card">
              {visible.length === 0 ? (
                <div className="state-box">No deals in this stage.</div>
              ) : (
                visible.map((d) => {
                  const name = data.athleteName[d.athleteId] ?? d.athleteId;
                  const next = dealRules.nextDealStatus(d.status);
                  const busy = movingId === d.id;
                  return (
                    <div
                      className={'prospect-row' + (d.id === focus ? ' row-focus' : '')}
                      key={d.id}
                      ref={d.id === focus ? focusScroll : undefined}
                    >
                      <div className="pr-mark">{name.charAt(0)}</div>
                      <div className="pr-body">
                        <div className="pr-line">
                          <Link className="pr-name link" to={`/deals/${d.id}`}>
                            {name}
                          </Link>
                          <StatusBadge kind="deal" value={d.status} />
                        </div>
                        <div className="pr-sub">NIL Deal</div>
                      </div>
                      <div className="pr-value">
                        {formatMoney(d.value)}
                        <span className="pv-term">
                          {formatDate(d.startDate)} – {formatDate(d.endDate)}
                        </span>
                      </div>
                      {canEdit && d.status !== 'closed' && (
                        <div className="pr-actions">
                          {next && next !== 'closed' && (
                            <button
                              className="btn btn-primary"
                              disabled={busy || saving}
                              onClick={() => void changeStatus(d, next)}
                            >
                              {busy ? 'Moving…' : `Advance to ${next}`}
                            </button>
                          )}
                          <button
                            className="btn"
                            disabled={busy || saving}
                            onClick={() => void changeStatus(d, 'closed')}
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </AsyncBoundary>

      {showNew && (
        <Modal title="New NIL Deal" onClose={() => setShowNew(false)}>
          <Field label="Athlete">
            <select value={fAthlete} onChange={(e) => setFAthlete(e.target.value)}>
              <option value="">Select an athlete…</option>
              {athletes.map(([aid, name]) => (
                <option key={aid} value={aid}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contract value (USD)">
            <input
              type="number"
              value={fAmount}
              placeholder="e.g. 750000"
              onChange={(e) => setFAmount(e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value as DealStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s.status} value={s.status}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date">
            <input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} />
          </Field>
          <Field label="End date">
            <input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} />
          </Field>
          <Field label="Payment installments (0 = none)">
            <input
              type="number"
              min="0"
              value={fInstallments}
              onChange={(e) => setFInstallments(e.target.value)}
            />
          </Field>
          {saveError && <div className="inline-error">{saveError}</div>}
          <button
            className="btn btn-primary"
            disabled={saving || !fAthlete || !Number(fAmount) || !fStart || !fEnd}
            onClick={submitNew}
          >
            {saving ? 'Creating…' : 'Create Deal'}
          </button>
        </Modal>
      )}
    </div>
  );
}
