import { Link } from 'react-router-dom';
import {
  PageHeader,
  AsyncBoundary,
  CardSkeleton,
  BarChart,
  Donut,
  type BarDatum,
  type DonutSegment,
} from '../../../ui';
import { formatMoney, formatMoneyCompact } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { useAuth } from '../../../auth/AuthContext';
import { ACTIVE_BACKEND } from '../../../services';
import type { DealStatus } from '../../../domain';
import { useDashboard } from '../hooks/useDashboard';

const STAGE_TONE: Record<DealStatus, BarDatum['tone']> = {
  negotiation: 'amber',
  signed: 'blue',
  active: 'green',
  closed: 'gray',
};

/** Operations overview — bento KPIs, pipeline health, payment mix, activity. */
export function DashboardView() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useDashboard();

  return (
    <div>
      <PageHeader
        title="Operations Overview"
        subtitle={`${user.name} · ${user.role} · data source: ${ACTIVE_BACKEND}`}
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<CardSkeleton count={6} />}
      >
        {data && (
          <>
            {data.summary.complianceAlerts > 0 && (
              <Link to="/compliance" className="alert-banner alert-amber alert-link">
                <span>
                  ⚠ {data.summary.complianceAlerts} compliance item
                  {data.summary.complianceAlerts === 1 ? '' : 's'} need attention.
                </span>
                <span className="alert-cta">Review →</span>
              </Link>
            )}

            {/* Bento KPI grid */}
            <div className="bento">
              <div className="tile tile-hero">
                <div className="t-label">Outstanding Receivables</div>
                <div className="t-value">
                  {formatMoney({ amount: data.summary.outstandingBalance, currency: 'USD' })}
                </div>
                <div className="t-hint">
                  {data.summary.overduePayments > 0 ? (
                    <>
                      <span className="up">{data.summary.overduePayments} overdue</span> ·
                      awaiting collection
                    </>
                  ) : (
                    'All payments on schedule'
                  )}
                </div>
              </div>

              <div className="tile">
                <div className="t-label">Overdue</div>
                <div className="t-value">{data.summary.overduePayments}</div>
                <div className="t-hint">Payments past due</div>
              </div>
              <div className="tile">
                <div className="t-label">Active Deals</div>
                <div className="t-value">{data.summary.activeDeals}</div>
                <div className="t-hint">Revenue-generating</div>
              </div>
              <div className="tile">
                <div className="t-label">Athletes</div>
                <div className="t-value">{data.summary.athleteCount}</div>
                <div className="t-hint">On the roster</div>
              </div>
              <div className="tile">
                <div className="t-label">Open Tasks</div>
                <div className="t-value">{data.summary.openTasks}</div>
                <div className="t-hint">In progress / pending</div>
              </div>
            </div>

            {/* Insight panels */}
            <div className="section-title">Insight</div>
            <div className="panel-grid">
              <div className="card">
                <div className="panel-head">
                  <h3>Deal Pipeline Health</h3>
                  <span className="muted">contract value by stage</span>
                </div>
                <BarChart
                  data={data.pipeline.map<BarDatum>((p) => ({
                    label: p.stage,
                    value: p.value,
                    caption: `${p.count} · ${formatMoneyCompact({ amount: p.value, currency: 'USD' })}`,
                    tone: STAGE_TONE[p.stage],
                  }))}
                />
              </div>

              <div className="card">
                <div className="panel-head">
                  <h3>Payments Breakdown</h3>
                  <span className="muted">by status</span>
                </div>
                <Donut
                  segments={data.payments.map<DonutSegment>((p) => ({
                    label: p.status,
                    value: p.count,
                    tone:
                      p.status === 'paid' ? 'green' : p.status === 'overdue' ? 'red' : 'blue',
                  }))}
                  centerValue={String(data.payments.reduce((s, p) => s + p.count, 0))}
                  centerLabel="Invoices"
                />
              </div>
            </div>

            {/* Recent activity */}
            <div className="section-title">Recent Activity</div>
            <div className="card">
              {data.activity.length === 0 ? (
                <div className="state-box">No recent activity.</div>
              ) : (
                <div className="activity-feed">
                  {data.activity.map((a) => (
                    <div className="activity-item" key={a.id}>
                      <span className={`activity-dot adot-${a.tone}`} />
                      <div className="activity-main">
                        <div className="activity-text">
                          <strong>{a.text}</strong> — {a.detail}
                        </div>
                        <div className="activity-meta">{formatDate(a.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
