import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  AsyncBoundary,
  StatCard,
  TableSkeleton,
  StatusBadge,
  Modal,
  Field,
} from '../../../ui';
import { focusScroll } from '../../../hooks/useFocusParam';
import { useQuickTask } from '../../../hooks/useQuickTask';
import { formatMoney } from '../../../utils/format';
import { formatDate, todayISO } from '../../../utils/date';
import { paymentRules, paymentsDomain, type Payment, type PaymentStatus } from '../../../domain';
import { usePayments } from '../hooks/usePayments';

type GroupBy = 'none' | 'status' | 'athlete' | 'month';

interface Group {
  key: string;
  label: string;
  rows: Payment[];
  subtotal: number;
}

function monthLabel(ym: string): string {
  const d = new Date(`${ym}-01T00:00:00`);
  return Number.isNaN(d.getTime())
    ? ym
    : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Payments financial module — the critical module.
 * Summary + overdue determination come from the payment domain service.
 * The view filters, groups, records new payments and settles invoices.
 */
export function PaymentTableView() {
  const { data, loading, error, reload, canCreate, canUpdate, create, markPaid, saving, saveError } =
    usePayments();
  const today = todayISO();

  const [params] = useSearchParams();
  const focus = params.get('focus');
  const quick = useQuickTask();
  const [status, setStatus] = useState<'all' | PaymentStatus>(() => {
    const s = params.get('status');
    return s === 'paid' || s === 'pending' || s === 'overdue' ? s : 'all';
  });
  const [athlete, setAthlete] = useState<'all' | string>('all');
  const [dueBefore, setDueBefore] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  // New-payment form
  const [showNew, setShowNew] = useState(false);
  const [fAthlete, setFAthlete] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDue, setFDue] = useState('');
  const [fStatus, setFStatus] = useState<PaymentStatus>('pending');

  const athleteOptions = useMemo(
    () => [...new Set((data?.payments ?? []).map((p) => p.athleteId))],
    [data],
  );

  const rows = useMemo(() => {
    return (data?.payments ?? []).filter((p) => {
      const eff = paymentRules.effectiveStatus(p, today);
      if (status !== 'all' && eff !== status) return false;
      if (athlete !== 'all' && p.athleteId !== athlete) return false;
      if (dueBefore && p.dueDate > dueBefore) return false;
      return true;
    });
  }, [data, status, athlete, dueBefore, today]);

  const summary = useMemo(() => {
    const payments = data?.payments ?? [];
    return {
      totalRevenue: paymentsDomain.calculateTotalRevenue(payments),
      outstanding: paymentsDomain.getTotalOutstanding(payments, today),
      overdue: paymentsDomain.getOverdueAmount(payments, today),
    };
  }, [data, today]);

  const groups = useMemo<Group[]>(() => {
    if (groupBy === 'none') return [];
    const keyOf = (p: Payment): { key: string; label: string } => {
      if (groupBy === 'status') {
        const k = paymentRules.effectiveStatus(p, today);
        return { key: k, label: k };
      }
      if (groupBy === 'athlete') {
        return { key: p.athleteId, label: data?.athleteName[p.athleteId] ?? p.athleteId };
      }
      const ym = p.dueDate.slice(0, 7);
      return { key: ym, label: monthLabel(ym) };
    };
    const map = new Map<string, Group>();
    for (const p of rows) {
      const { key, label } = keyOf(p);
      const g = map.get(key) ?? { key, label, rows: [], subtotal: 0 };
      g.rows.push(p);
      g.subtotal += p.amount.amount;
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, groupBy, today, data]);

  const currency = data?.payments[0]?.amount.currency ?? 'USD';

  async function submitNew() {
    const amount = Number(fAmount);
    if (!fAthlete || !amount || !fDue) return;
    const payload: Omit<Payment, 'id'> = {
      athleteId: fAthlete,
      amount: { amount, currency: 'USD' },
      dueDate: fDue,
      status: fStatus,
    };
    const done = await create(payload);
    if (done) {
      setShowNew(false);
      setFAthlete('');
      setFAmount('');
      setFDue('');
    }
  }

  function renderTable(list: Payment[]) {
    return (
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Athlete</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Status</th>
            {(canUpdate || quick.canCreate) && <th />}
          </tr>
        </thead>
        <tbody>
          {list.map((p) => {
            const eff = paymentRules.effectiveStatus(p, today);
            const overdue = eff === 'overdue';
            return (
              <tr
                key={p.id}
                ref={p.id === focus ? focusScroll : undefined}
                className={
                  [overdue && 'row-overdue', p.id === focus && 'row-focus']
                    .filter(Boolean)
                    .join(' ') || undefined
                }
              >
                <td>
                  <span className="mono">INV-{p.id.toUpperCase()}</span>
                </td>
                <td>{data?.athleteName[p.athleteId] ?? p.athleteId}</td>
                <td className={overdue ? 'amount-overdue' : undefined}>
                  {formatMoney(p.amount)}
                </td>
                <td>{formatDate(p.dueDate)}</td>
                <td>
                  <StatusBadge kind="payment" value={eff} />
                </td>
                {(canUpdate || quick.canCreate) && (
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {canUpdate && eff !== 'paid' && (
                        <button
                          className="btn"
                          disabled={saving}
                          onClick={() => markPaid(p.id)}
                        >
                          Mark paid
                        </button>
                      )}
                      {quick.canCreate &&
                        overdue &&
                        (quick.createdKeys.has(p.id) ? (
                          <span className="muted">Task added</span>
                        ) : (
                          <button
                            className="btn"
                            disabled={quick.busyKey === p.id}
                            onClick={() =>
                              void quick.createTask(p.id, {
                                title: `Follow up overdue payment — ${data?.athleteName[p.athleteId] ?? p.athleteId}`,
                                athleteId: p.athleteId,
                                priority: 'high',
                                dueInDays: 7,
                              })
                            }
                          >
                            + Task
                          </button>
                        ))}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Invoices, balances and overdue tracking."
        actions={
          <button
            className="btn btn-primary"
            disabled={!canCreate || !data}
            onClick={() => setShowNew(true)}
          >
            + New Payment
          </button>
        }
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<TableSkeleton rows={6} cols={5} />}
        isEmpty={!!data && data.payments.length === 0}
        emptyText="No payments visible to your role."
      >
        {data && (
          <>
            <div className="grid grid-3">
              <StatCard
                label="Total Revenue"
                value={formatMoney({ amount: summary.totalRevenue, currency })}
                hint="Settled payments"
              />
              <StatCard
                label="Outstanding Balance"
                value={formatMoney({ amount: summary.outstanding, currency })}
                hint="Pending + overdue"
                accent
              />
              <StatCard
                label="Overdue Amount"
                value={formatMoney({ amount: summary.overdue, currency })}
                hint="Past due date"
              />
            </div>

            <div className="section-title">Invoices</div>

            <div className="filter-bar">
              <span className="filter-label">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'all' | PaymentStatus)}
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <span className="filter-label">Athlete</span>
              <select value={athlete} onChange={(e) => setAthlete(e.target.value)}>
                <option value="all">All</option>
                {athleteOptions.map((a) => (
                  <option key={a} value={a}>
                    {data.athleteName[a] ?? a}
                  </option>
                ))}
              </select>
              <span className="filter-label">Due before</span>
              <input
                type="date"
                value={dueBefore}
                onChange={(e) => setDueBefore(e.target.value)}
              />
              <span className="filter-label">Group by</span>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
                <option value="none">None</option>
                <option value="status">Status</option>
                <option value="athlete">Athlete</option>
                <option value="month">Due month</option>
              </select>
            </div>

            {rows.length === 0 ? (
              <div className="card">
                <div className="state-box">No payments match these filters.</div>
              </div>
            ) : groupBy === 'none' ? (
              <div className="card">{renderTable(rows)}</div>
            ) : (
              groups.map((g) => (
                <div className="group-block" key={g.key}>
                  <div className="group-head">
                    <span className="g-name">{g.label}</span>
                    <span className="g-sub">
                      {g.rows.length} invoice{g.rows.length === 1 ? '' : 's'} ·{' '}
                      {formatMoney({ amount: g.subtotal, currency })}
                    </span>
                  </div>
                  <div className="card">{renderTable(g.rows)}</div>
                </div>
              ))
            )}
          </>
        )}
      </AsyncBoundary>

      {showNew && (
        <Modal title="New Payment" onClose={() => setShowNew(false)}>
          <Field label="Athlete">
            <select value={fAthlete} onChange={(e) => setFAthlete(e.target.value)}>
              <option value="">Select an athlete…</option>
              {athleteOptions.map((a) => (
                <option key={a} value={a}>
                  {data?.athleteName[a] ?? a}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount (USD)">
            <input
              type="number"
              value={fAmount}
              placeholder="e.g. 50000"
              onChange={(e) => setFAmount(e.target.value)}
            />
          </Field>
          <Field label="Due date">
            <input type="date" value={fDue} onChange={(e) => setFDue(e.target.value)} />
          </Field>
          <Field label="Status">
            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value as PaymentStatus)}
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </Field>
          {saveError && <div className="inline-error">{saveError}</div>}
          <button
            className="btn btn-primary"
            disabled={saving || !fAthlete || !Number(fAmount) || !fDue}
            onClick={submitNew}
          >
            {saving ? 'Recording…' : 'Record Payment'}
          </button>
        </Modal>
      )}
    </div>
  );
}
