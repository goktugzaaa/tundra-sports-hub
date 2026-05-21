import { useMemo, useState } from 'react';
import {
  PageHeader,
  AsyncBoundary,
  StatCard,
  CardSkeleton,
  StatusBadge,
  Modal,
  Field,
} from '../../../ui';
import { focusScroll, useFocusParam } from '../../../hooks/useFocusParam';
import { useQuickTask } from '../../../hooks/useQuickTask';
import { formatDate, todayISO } from '../../../utils/date';
import { complianceRules, complianceDomain, type ComplianceItem } from '../../../domain';
import { useCompliance } from '../hooks/useCompliance';

/** Default renewal = one year from today. */
function plusYear(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Compliance module — alerts dashboard, per-athlete timeline, and
 * digital resolution: pending/flagged items are cleared and expired
 * items renewed in place. Status patches come from the domain layer.
 */
export function ComplianceListView() {
  const { data, loading, error, reload, canResolve, resolve, renew, saving, saveError } =
    useCompliance();
  const today = todayISO();
  const focus = useFocusParam();
  const quick = useQuickTask();

  const [renewItem, setRenewItem] = useState<ComplianceItem | null>(null);
  const [renewDate, setRenewDate] = useState('');

  const summary = useMemo(() => {
    const items = data?.items ?? [];
    return {
      expired: complianceDomain.getExpiredItems(items, today).length,
      expiringSoon: complianceDomain.getExpiringSoon(items, today).length,
      pending: items.filter((i) => i.status === 'pending').length,
    };
  }, [data, today]);

  const groups = useMemo(() => {
    const byAthlete = new Map<string, ComplianceItem[]>();
    for (const item of data?.items ?? []) {
      const list = byAthlete.get(item.athleteId) ?? [];
      list.push(item);
      byAthlete.set(item.athleteId, list);
    }
    return [...byAthlete.entries()].map(([athleteId, items]) => ({
      athleteId,
      items: [...items].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
      health: complianceDomain.getComplianceStatus(items, athleteId, today),
    }));
  }, [data, today]);

  function openRenew(item: ComplianceItem) {
    setRenewItem(item);
    setRenewDate(plusYear(today));
  }

  async function submitRenew() {
    if (!renewItem || !renewDate) return;
    const done = await renew(renewItem, renewDate);
    if (done) setRenewItem(null);
  }

  return (
    <div>
      <PageHeader
        title="Compliance"
        subtitle="Regulatory tracking, expiry alerts and per-athlete timelines."
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<CardSkeleton count={3} />}
        isEmpty={!!data && data.items.length === 0}
        emptyText="No compliance items visible to your role."
      >
        {data && (
          <>
            {summary.expired > 0 && (
              <div className="alert-banner alert-red">
                ⚠ {summary.expired} compliance item{summary.expired === 1 ? '' : 's'} expired —
                immediate action required.
              </div>
            )}
            {summary.expired === 0 && summary.expiringSoon > 0 && (
              <div className="alert-banner alert-amber">
                {summary.expiringSoon} item{summary.expiringSoon === 1 ? '' : 's'} expiring soon.
              </div>
            )}

            <div className="grid grid-3">
              <StatCard label="Expired" value={summary.expired} />
              <StatCard label="Expiring Soon" value={summary.expiringSoon} />
              <StatCard label="Pending Clearance" value={summary.pending} />
            </div>

            <div className="section-title">Athlete Compliance Timelines</div>
            {groups.map((group) => (
              <div className="card timeline-group" key={group.athleteId}>
                <h4>
                  {data.athleteName[group.athleteId] ?? group.athleteId}{' '}
                  <StatusBadge
                    kind="compliance"
                    value={group.health.status === 'attention' ? 'flagged' : 'valid'}
                  />{' '}
                  {group.health.alerts > 0 && (
                    <span className="muted">
                      {group.health.alerts} alert{group.health.alerts === 1 ? '' : 's'}
                    </span>
                  )}
                </h4>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((c) => {
                      const status = complianceRules.effectiveComplianceStatus(c, today);
                      const soon = complianceRules.isExpiringSoon(c, today);
                      return (
                        <tr
                          key={c.id}
                          ref={c.id === focus ? focusScroll : undefined}
                          className={c.id === focus ? 'row-focus' : undefined}
                        >
                          <td>{c.type}</td>
                          <td style={{ color: soon ? 'var(--amber)' : undefined }}>
                            {formatDate(c.expiryDate)}
                            {soon && ' · expiring soon'}
                          </td>
                          <td>
                            <StatusBadge kind="compliance" value={status} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {status === 'expired' && (
                                <button
                                  className="btn"
                                  disabled={!canResolve || saving}
                                  onClick={() => openRenew(c)}
                                >
                                  Renew
                                </button>
                              )}
                              {(status === 'pending' || status === 'flagged') && (
                                <button
                                  className="btn"
                                  disabled={!canResolve || saving}
                                  onClick={() => void resolve(c)}
                                >
                                  {status === 'pending' ? 'Approve' : 'Resolve'}
                                </button>
                              )}
                              {status !== 'valid' &&
                                quick.canCreate &&
                                (quick.createdKeys.has(c.id) ? (
                                  <span className="muted">Task added</span>
                                ) : (
                                  <button
                                    className="btn"
                                    disabled={quick.busyKey === c.id}
                                    onClick={() =>
                                      void quick.createTask(c.id, {
                                        title: `Resolve ${c.type} — ${data.athleteName[c.athleteId] ?? c.athleteId}`,
                                        athleteId: c.athleteId,
                                        priority: status === 'expired' ? 'high' : 'medium',
                                      })
                                    }
                                  >
                                    + Task
                                  </button>
                                ))}
                              {status === 'valid' && <span className="muted">—</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {saveError && <div className="inline-error">{saveError}</div>}
          </>
        )}
      </AsyncBoundary>

      {renewItem && (
        <Modal title={`Renew — ${renewItem.type}`} onClose={() => setRenewItem(null)}>
          <p className="muted" style={{ marginBottom: 14 }}>
            Mark this item valid again and set a new expiry date.
          </p>
          <Field label="New expiry date">
            <input
              type="date"
              value={renewDate}
              onChange={(e) => setRenewDate(e.target.value)}
            />
          </Field>
          {saveError && <div className="inline-error">{saveError}</div>}
          <button
            className="btn btn-primary"
            disabled={saving || !renewDate}
            onClick={submitRenew}
          >
            {saving ? 'Renewing…' : 'Confirm Renewal'}
          </button>
        </Modal>
      )}
    </div>
  );
}
