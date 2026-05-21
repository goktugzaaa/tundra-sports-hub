import { PageHeader, AsyncBoundary, CardSkeleton, StatusBadge } from '../../../ui';
import { formatMoney, formatMoneyCompact } from '../../../utils/format';
import { formatDate, todayISO } from '../../../utils/date';
import { paymentRules, complianceRules } from '../../../domain';
import { useAthletePortal } from '../hooks/useAthletePortal';

/**
 * Athlete portal — a personal workspace for the ATHLETE role, distinct
 * from the agency admin dashboard. Athlete-centric framing: "my deals",
 * "my payments", "my compliance".
 */
export function AthletePortalView() {
  const { data, loading, error, reload, canActTask, toggleTask, busyTask } =
    useAthletePortal();
  const today = todayISO();

  return (
    <div className="op-legacy">
      <PageHeader title="My Portal" subtitle="Your contracts, payments and compliance at a glance." />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<CardSkeleton count={3} />}
        isEmpty={data === null}
        emptyText="No athlete profile linked to this account."
      >
        {data && (
          <>
            <div className="portal-cover">
              <div className="portal-eyebrow">Athlete Portal</div>
              <div className="portal-name">{data.athlete.name}</div>
              <div className="portal-sub">
                {data.athlete.stats.position} · {data.athlete.stats.sport} ·{' '}
                {String(data.athlete.metadata.club ?? 'Free agent')}
              </div>
              <div className="portal-cover-stats">
                <div>
                  <div className="n">
                    {formatMoneyCompact({ amount: data.totalRevenue, currency: 'USD' })}
                  </div>
                  <div className="l">Earned</div>
                </div>
                <div>
                  <div className="n">
                    {formatMoneyCompact({ amount: data.outstanding, currency: 'USD' })}
                  </div>
                  <div className="l">Outstanding</div>
                </div>
                <div>
                  <div className="n">{data.deals.length}</div>
                  <div className="l">NIL Deals</div>
                </div>
                <div>
                  <div className="n">{data.openTasks}</div>
                  <div className="l">Open Tasks</div>
                </div>
              </div>
            </div>

            <div className="portal-grid">
              <div className="card">
                <h3 style={{ marginBottom: 10 }}>My NIL Deals</h3>
                <div className="portal-list">
                  {data.deals.length === 0 && <div className="muted">No deals yet.</div>}
                  {data.deals.map((d) => (
                    <div className="portal-row" key={d.id}>
                      <div>
                        <div className="pr-main">{formatMoneyCompact(d.value)}</div>
                        <div className="pr-meta">
                          {formatDate(d.startDate)} → {formatDate(d.endDate)}
                        </div>
                      </div>
                      <StatusBadge kind="deal" value={d.status} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 10 }}>Payments</h3>
                <div className="portal-list">
                  {data.payments.length === 0 && (
                    <div className="muted">No payments yet.</div>
                  )}
                  {data.payments.map((p) => {
                    const eff = paymentRules.effectiveStatus(p, today);
                    return (
                      <div className="portal-row" key={p.id}>
                        <div>
                          <div className="pr-main">{formatMoney(p.amount)}</div>
                          <div className="pr-meta">Due {formatDate(p.dueDate)}</div>
                        </div>
                        <StatusBadge kind="payment" value={eff} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 10 }}>Compliance</h3>
                <div className="portal-list">
                  {data.compliance.length === 0 && (
                    <div className="muted">No compliance items.</div>
                  )}
                  {data.compliance.map((c) => {
                    const eff = complianceRules.effectiveComplianceStatus(c, today);
                    return (
                      <div className="portal-row" key={c.id}>
                        <div>
                          <div className="pr-main">{c.type}</div>
                          <div className="pr-meta">Expires {formatDate(c.expiryDate)}</div>
                        </div>
                        <StatusBadge kind="compliance" value={eff} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 10 }}>Tasks</h3>
                <div className="portal-list">
                  {data.tasks.length === 0 && <div className="muted">Nothing assigned.</div>}
                  {data.tasks.map((t) => (
                    <div className="portal-row" key={t.id}>
                      <div>
                        <div className="pr-main">{t.title}</div>
                        <div className="pr-meta">Due {formatDate(t.dueDate)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge kind="task" value={t.status} />
                        {canActTask && t.status !== 'done' && (
                          <button
                            className="btn"
                            disabled={busyTask === t.id}
                            onClick={() => void toggleTask(t)}
                          >
                            {busyTask === t.id ? '…' : 'Advance'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
