import { Fragment, useMemo, useState } from 'react';
import { AsyncBoundary, Modal, Field } from '../../../ui';
import { Ic, StatusTag, initials, type OpTone } from '../../../ui/ops';
import { formatDate, todayISO } from '../../../utils/date';
import { complianceRules, complianceDomain, type ComplianceItem } from '../../../domain';
import { useCompliance } from '../hooks/useCompliance';

const STATUS_TONE: Record<string, OpTone> = {
  valid: 'ok',
  pending: 'warn',
  expired: 'alert',
  flagged: 'alert',
};

/** Default renewal = one year from today. */
function plusYear(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Compliance — operator register. A "needs attention" flags table over a
 * per-athlete obligations register grouped with subtotal headers.
 */
export function ComplianceListView() {
  const { data, loading, error, reload, canResolve, resolve, renew, saving, saveError } =
    useCompliance();
  const today = todayISO();

  const [renewItem, setRenewItem] = useState<ComplianceItem | null>(null);
  const [renewDate, setRenewDate] = useState('');

  const items = data?.items ?? [];
  const athleteName = data?.athleteName ?? {};

  const summary = useMemo(
    () => ({
      expired: complianceDomain.getExpiredItems(items, today).length,
      expiringSoon: complianceDomain.getExpiringSoon(items, today).length,
      pending: items.filter((i) => i.status === 'pending').length,
      total: items.length,
    }),
    [items, today],
  );

  const flags = useMemo(
    () => items.filter((c) => complianceRules.needsAttention(c, today)),
    [items, today],
  );

  const groups = useMemo(() => {
    const byAthlete = new Map<string, ComplianceItem[]>();
    for (const item of items) {
      const list = byAthlete.get(item.athleteId) ?? [];
      list.push(item);
      byAthlete.set(item.athleteId, list);
    }
    return [...byAthlete.entries()].map(([athleteId, list]) => ({
      athleteId,
      items: [...list].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    }));
  }, [items]);

  function openRenew(item: ComplianceItem) {
    setRenewItem(item);
    setRenewDate(plusYear(today));
  }
  async function submitRenew() {
    if (!renewItem || !renewDate) return;
    const done = await renew(renewItem, renewDate);
    if (done) setRenewItem(null);
  }

  function ActionCell({ c }: { c: ComplianceItem }) {
    const status = complianceRules.effectiveComplianceStatus(c, today);
    if (status === 'expired')
      return (
        <button
          className="op-btn"
          style={{ height: 24, fontSize: 11.5 }}
          disabled={!canResolve || saving}
          onClick={() => openRenew(c)}
        >
          Renew
        </button>
      );
    if (status === 'pending' || status === 'flagged')
      return (
        <button
          className="op-btn"
          style={{ height: 24, fontSize: 11.5 }}
          disabled={!canResolve || saving}
          onClick={() => void resolve(c)}
        >
          {status === 'pending' ? 'Approve' : 'Resolve'}
        </button>
      );
    return <span className="dim">—</span>;
  }

  return (
    <div className="op-tablepage">
      <div className="op-tp-head">
        <div className="head">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1>Compliance</h1>
            <span className="subtle">{summary.total} obligations tracked</span>
          </div>
          <div className="actions">
            <button className="op-btn">
              <Ic.download /> Audit log
            </button>
          </div>
        </div>

        <div className="op-summary-line">
          <SumItem l="Expired" v={String(summary.expired)} tone={summary.expired ? 'alert' : ''} />
          <Sep />
          <SumItem
            l="Expiring soon"
            v={String(summary.expiringSoon)}
            tone={summary.expiringSoon ? 'warn' : ''}
          />
          <Sep />
          <SumItem l="Pending clearance" v={String(summary.pending)} />
          <Sep />
          <SumItem l="Open flags" v={String(flags.length)} tone={flags.length ? 'alert' : ''} />
        </div>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && items.length === 0}
        emptyText="No compliance items visible to your role."
      >
        <div className="op-tp-head" style={{ paddingTop: 18, paddingBottom: 0 }}>
          {flags.length > 0 && (
            <div className="op-banner alert">
              <Ic.warning {...{ className: 'b-ico' }} />
              <span className="b-body">
                <b>
                  {flags.length} compliance item{flags.length === 1 ? '' : 's'}
                </b>{' '}
                need attention — expired, flagged or pending clearance.
              </span>
            </div>
          )}

          <div className="op-h">
            <h3>Needs attention</h3>
            <div className="h-meta">
              <b>{flags.length}</b> open
            </div>
          </div>
        </div>

        <div className="op-tp-scroll">
          <table className="op-dtable">
            <thead>
              <tr>
                <th>Athlete</th>
                <th>Obligation</th>
                <th>Status</th>
                <th className="right">Expiry</th>
                <th className="right" style={{ width: 110 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="dim" style={{ textAlign: 'center', padding: 24 }}>
                    Nothing flagged — all obligations current.
                  </td>
                </tr>
              ) : (
                flags.map((c) => {
                  const status = complianceRules.effectiveComplianceStatus(c, today);
                  return (
                    <tr key={c.id} className="alert">
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span className="op-avo">
                            {initials(athleteName[c.athleteId] ?? c.athleteId)}
                          </span>
                          <span className="strong">
                            {athleteName[c.athleteId] ?? c.athleteId}
                          </span>
                        </span>
                      </td>
                      <td>{c.type}</td>
                      <td>
                        <StatusTag tone={STATUS_TONE[status] ?? ''} label={status} />
                      </td>
                      <td className="right mono">{formatDate(c.expiryDate)}</td>
                      <td className="right">
                        <ActionCell c={c} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="op-tp-head" style={{ paddingTop: 22, paddingBottom: 0 }}>
          <div className="op-h">
            <h3>Per-athlete register</h3>
            <div className="h-meta">required documents · grouped</div>
          </div>
        </div>

        <div className="op-tp-scroll">
          <table className="op-dtable">
            <thead>
              <tr>
                <th>Obligation</th>
                <th>Status</th>
                <th className="right">Expiry</th>
                <th className="right" style={{ width: 110 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.athleteId}>
                  <tr className="head">
                    <td colSpan={4}>
                      {(athleteName[g.athleteId] ?? g.athleteId).toUpperCase()} · {g.items.length}{' '}
                      OBLIGATION{g.items.length === 1 ? '' : 'S'}
                    </td>
                  </tr>
                  {g.items.map((c) => {
                    const status = complianceRules.effectiveComplianceStatus(c, today);
                    const soon = complianceRules.isExpiringSoon(c, today);
                    return (
                      <tr key={c.id} className={status === 'expired' ? 'alert' : ''}>
                        <td className="strong">{c.type}</td>
                        <td>
                          <StatusTag tone={STATUS_TONE[status] ?? ''} label={status} />
                        </td>
                        <td
                          className="right mono"
                          style={{ color: soon ? 'var(--warn)' : undefined }}
                        >
                          {formatDate(c.expiryDate)}
                          {soon ? ' · soon' : ''}
                        </td>
                        <td className="right">
                          <ActionCell c={c} />
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {saveError && (
          <div className="op-inline-error" style={{ margin: '8px 22px' }}>
            {saveError}
          </div>
        )}
      </AsyncBoundary>

      {renewItem && (
        <Modal title={`Renew — ${renewItem.type}`} onClose={() => setRenewItem(null)}>
          <p className="dim" style={{ marginBottom: 14 }}>
            Mark this item valid again and set a new expiry date.
          </p>
          <Field label="New expiry date">
            <input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} />
          </Field>
          {saveError && <div className="op-inline-error">{saveError}</div>}
          <button
            className="op-btn op-btn-primary"
            style={{ height: 30, marginTop: 4 }}
            disabled={saving || !renewDate}
            onClick={submitRenew}
          >
            {saving ? 'Renewing…' : 'Confirm renewal'}
          </button>
        </Modal>
      )}
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
