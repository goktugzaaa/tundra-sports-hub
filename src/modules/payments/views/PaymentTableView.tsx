import { useMemo, useState } from 'react';
import { AsyncBoundary, Modal, Field } from '../../../ui';
import { Ic, StatusTag, initials, type OpTone } from '../../../ui/ops';
import { formatMoney } from '../../../utils/format';
import { formatDate, todayISO } from '../../../utils/date';
import { paymentRules, paymentsDomain, type Payment, type PaymentStatus } from '../../../domain';
import { usePayments } from '../hooks/usePayments';

const STATUS_TONE: Record<PaymentStatus, OpTone> = {
  paid: 'ok',
  pending: 'warn',
  overdue: 'alert',
};

/** Whole days between two ISO dates (a − b). */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

interface Bucket {
  key: PaymentStatus;
  label: string;
  rows: Payment[];
  subtotal: number;
}

/**
 * Payments — table-first ledger grouped by aging. Bulk-select drives the
 * dark action bar; an invoice drawer opens on row click. RBAC-scoped.
 */
export function PaymentTableView() {
  const { data, loading, error, reload, canCreate, canUpdate, create, markPaid, saving, saveError } =
    usePayments();
  const today = todayISO();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [fAthlete, setFAthlete] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDue, setFDue] = useState('');
  const [fStatus, setFStatus] = useState<PaymentStatus>('pending');

  const payments = data?.payments ?? [];
  const athleteName = data?.athleteName ?? {};
  const currency = payments[0]?.amount.currency ?? 'USD';

  const summary = useMemo(
    () => ({
      revenue: paymentsDomain.calculateTotalRevenue(payments),
      outstanding: paymentsDomain.getTotalOutstanding(payments, today),
      overdue: paymentsDomain.getOverdueAmount(payments, today),
    }),
    [payments, today],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      const name = (athleteName[p.athleteId] ?? p.athleteId).toLowerCase();
      return name.includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [payments, search, athleteName]);

  const buckets = useMemo<Bucket[]>(() => {
    const order: PaymentStatus[] = ['overdue', 'pending', 'paid'];
    const label: Record<PaymentStatus, string> = {
      overdue: 'Overdue',
      pending: 'Pending',
      paid: 'Cleared',
    };
    return order
      .map((key) => {
        const list = rows
          .filter((p) => paymentRules.effectiveStatus(p, today) === key)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        return {
          key,
          label: label[key],
          rows: list,
          subtotal: list.reduce((s, p) => s + p.amount.amount, 0),
        };
      })
      .filter((b) => b.rows.length > 0);
  }, [rows, today]);

  const open = openId ? payments.find((p) => p.id === openId) ?? null : null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkClear() {
    for (const id of selected) {
      const p = payments.find((x) => x.id === id);
      if (p && paymentRules.effectiveStatus(p, today) !== 'paid') await markPaid(id);
    }
    setSelected(new Set());
  }

  async function submitNew() {
    const amount = Number(fAmount);
    if (!fAthlete || !amount || !fDue) return;
    const done = await create({
      athleteId: fAthlete,
      amount: { amount, currency: 'USD' },
      dueDate: fDue,
      status: fStatus,
    });
    if (done) {
      setShowNew(false);
      setFAthlete('');
      setFAmount('');
      setFDue('');
    }
  }

  const athleteOptions = useMemo(
    () => [...new Set(payments.map((p) => p.athleteId))],
    [payments],
  );

  return (
    <div className="op-tablepage">
      <div className="op-tp-head">
        <div className="head">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1>Payments</h1>
            <span className="subtle">
              {rows.length} of {payments.length} shown · {currency}
            </span>
          </div>
          <div className="actions">
            <button className="op-btn legacy">Print</button>
            <button className="op-btn">
              <Ic.download /> Export
            </button>
            <button
              className="op-btn op-btn-primary"
              disabled={!canCreate}
              onClick={() => setShowNew(true)}
            >
              <Ic.plus /> Record payment
            </button>
          </div>
        </div>

        <div className="op-summary-line">
          <SumItem l="Total revenue" v={formatMoney({ amount: summary.revenue, currency })} tone="ok" />
          <Sep />
          <SumItem
            l="Outstanding"
            v={formatMoney({ amount: summary.outstanding, currency })}
            tone="warn"
          />
          <Sep />
          <SumItem
            l="Overdue"
            v={formatMoney({ amount: summary.overdue, currency })}
            tone="alert"
          />
          <Sep />
          <SumItem l="Invoices" v={String(payments.length)} />
        </div>
      </div>

      <div className="op-tablebar">
        <div className="search">
          <Ic.search />
          <input
            placeholder="Search by invoice or athlete…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="gap" />
        <span className="results">{rows.length} results · grouped by age</span>
      </div>

      {selected.size > 0 && (
        <div className="op-bulk" style={{ margin: '8px 22px 0' }}>
          <span className="count">{selected.size} selected</span>
          <button onClick={() => void bulkClear()} disabled={!canUpdate || saving}>
            ✓ Mark cleared
          </button>
          <span className="sep">/</span>
          <button>Send to bookkeeper</button>
          <span className="sep">/</span>
          <button>
            <Ic.download /> Export selection
          </button>
          <button className="close" onClick={() => setSelected(new Set())}>
            ✕ clear
          </button>
        </div>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && payments.length === 0}
        emptyText="No payments visible to your role."
      >
        <div className="op-tp-scroll" style={{ marginTop: 6 }}>
          <table className="op-dtable">
            <thead>
              <tr>
                <th style={{ width: 28 }} />
                <th>Invoice</th>
                <th>Athlete</th>
                <th>Status</th>
                <th className="right">Amount</th>
                <th className="right">Due / cleared</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {buckets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="dim" style={{ textAlign: 'center', padding: 28 }}>
                    No payments match these filters.
                  </td>
                </tr>
              ) : (
                buckets.map((b) => (
                  <BucketGroup
                    key={b.key}
                    bucket={b}
                    currency={currency}
                    today={today}
                    athleteName={athleteName}
                    selected={selected}
                    openId={openId}
                    onToggle={toggle}
                    onOpen={setOpenId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      <div className="op-tablefoot" style={{ margin: '0 22px' }}>
        <span>
          Showing {rows.length} of {payments.length} · grouped by age
        </span>
        <span>{currency} · all amounts</span>
      </div>

      {open && (
        <InvoiceDrawer
          payment={open}
          athleteName={athleteName[open.athleteId] ?? open.athleteId}
          today={today}
          canUpdate={canUpdate}
          saving={saving}
          onMarkPaid={() => void markPaid(open.id)}
          onClose={() => setOpenId(null)}
        />
      )}

      {showNew && (
        <Modal title="Record payment" onClose={() => setShowNew(false)}>
          <Field label="Athlete">
            <select value={fAthlete} onChange={(e) => setFAthlete(e.target.value)}>
              <option value="">Select an athlete…</option>
              {athleteOptions.map((a) => (
                <option key={a} value={a}>
                  {athleteName[a] ?? a}
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
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value as PaymentStatus)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </Field>
          {saveError && <div className="op-inline-error">{saveError}</div>}
          <button
            className="op-btn op-btn-primary"
            style={{ height: 30, marginTop: 4 }}
            disabled={saving || !fAthlete || !Number(fAmount) || !fDue}
            onClick={submitNew}
          >
            {saving ? 'Recording…' : 'Record payment'}
          </button>
        </Modal>
      )}
    </div>
  );
}

function BucketGroup({
  bucket,
  currency,
  today,
  athleteName,
  selected,
  openId,
  onToggle,
  onOpen,
}: {
  bucket: Bucket;
  currency: string;
  today: string;
  athleteName: Record<string, string>;
  selected: Set<string>;
  openId: string | null;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <tr className="head">
        <td colSpan={7}>
          {bucket.label}
          <span className="gh-sub">
            {bucket.rows.length} {bucket.rows.length === 1 ? 'invoice' : 'invoices'} ·{' '}
            {formatMoney({ amount: bucket.subtotal, currency })}
          </span>
        </td>
      </tr>
      {bucket.rows.map((p) => {
        const eff = paymentRules.effectiveStatus(p, today);
        const overdueDays = eff === 'overdue' ? daysBetween(today, p.dueDate) : 0;
        const label =
          eff === 'overdue'
            ? `${overdueDays}d over`
            : eff === 'pending'
              ? 'pending'
              : 'cleared';
        return (
          <tr
            key={p.id}
            className={(openId === p.id ? 'open ' : '') + (eff === 'overdue' ? 'alert' : '')}
            onClick={() => onOpen(p.id)}
          >
            <td onClick={(e) => e.stopPropagation()}>
              <span
                className={'op-check' + (selected.has(p.id) ? ' on' : '')}
                onClick={() => onToggle(p.id)}
              />
            </td>
            <td className="strong mono">INV-{p.id.toUpperCase()}</td>
            <td>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="op-avo">{initials(athleteName[p.athleteId] ?? p.athleteId)}</span>
                <span className="strong">{athleteName[p.athleteId] ?? p.athleteId}</span>
              </span>
            </td>
            <td>
              <StatusTag tone={STATUS_TONE[eff]} label={label} />
            </td>
            <td
              className="right strong num"
              style={{ color: eff === 'overdue' ? 'var(--alert)' : undefined }}
            >
              {formatMoney(p.amount)}
            </td>
            <td className="right mono">{formatDate(p.dueDate)}</td>
            <td onClick={(e) => e.stopPropagation()}>
              <button className="op-iconbtn" onClick={() => onOpen(p.id)}>
                <Ic.more />
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function InvoiceDrawer({
  payment,
  athleteName,
  today,
  canUpdate,
  saving,
  onMarkPaid,
  onClose,
}: {
  payment: Payment;
  athleteName: string;
  today: string;
  canUpdate: boolean;
  saving: boolean;
  onMarkPaid: () => void;
  onClose: () => void;
}) {
  const eff = paymentRules.effectiveStatus(payment, today);
  const overdueDays = eff === 'overdue' ? daysBetween(today, payment.dueDate) : 0;
  return (
    <div className="op-drawer-wrap">
      <div className="op-drawer-scrim" onClick={onClose} />
      <aside className="op-drawer">
        <header className="op-drawer-head">
          <div className="avo">{initials(athleteName)}</div>
          <div className="title">
            <div className="name">INV-{payment.id.toUpperCase()}</div>
            <div className="id">
              {formatMoney(payment.amount)} ·{' '}
              {eff === 'overdue' ? `${overdueDays} days overdue` : eff} · {athleteName}
            </div>
          </div>
          <button className="x" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="op-drawer-actions">
          <button
            className="op-btn"
            disabled={!canUpdate || eff === 'paid' || saving}
            onClick={onMarkPaid}
          >
            ✓ Mark cleared
          </button>
          <button className="op-btn">Send reminder</button>
          <span className="spacer" />
          <button className="op-btn op-btn-primary">Assign…</button>
        </div>

        <div className="op-drawer-body">
          <div className="op-drawer-section">
            <div className="ds-head">
              <h4>Invoice</h4>
              <span className="meta">due {formatDate(payment.dueDate)}</span>
            </div>
            <div className="op-drawer-kv">
              <div>
                <div className="k">Amount</div>
                <div
                  className="v"
                  style={{ color: eff === 'overdue' ? 'var(--alert)' : undefined }}
                >
                  {formatMoney(payment.amount)}
                </div>
              </div>
              <div>
                <div className="k">Status</div>
                <div className="v">
                  <StatusTag
                    tone={STATUS_TONE[eff]}
                    label={eff === 'overdue' ? `${overdueDays}d overdue` : eff}
                  />
                </div>
              </div>
              <div>
                <div className="k">Athlete</div>
                <div className="v">{athleteName}</div>
              </div>
              <div>
                <div className="k">Due date</div>
                <div className="v">{formatDate(payment.dueDate)}</div>
              </div>
              <div>
                <div className="k">Recorded status</div>
                <div className="v">{payment.status}</div>
              </div>
              <div>
                <div className="k">Currency</div>
                <div className="v">{payment.amount.currency}</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="op-drawer-foot">
          <span>invoice INV-{payment.id.toUpperCase()}</span>
          <span className="spacer" />
          <span>{payment.amount.currency}</span>
        </footer>
      </aside>
    </div>
  );
}

function SumItem({ l, v, tone = '' }: { l: string; v: string; tone?: string }) {
  return (
    <span className="item">
      <span className="l">{l}</span>
      <span className={'v ' + tone}>{v}</span>
    </span>
  );
}
function Sep() {
  return <span className="sep">·</span>;
}
