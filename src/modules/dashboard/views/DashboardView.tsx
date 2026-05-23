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
    <div className="op-page with-aside">
      <div className="primary">
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

            {/* Action queue — what needs you */}
            {data.actionQueue.length > 0 && (
              <>
                <div className="section-title">Needs Attention</div>
                <div className="card">
                  <div className="activity-feed">
                    {data.actionQueue.map((a) => (
                      <Link className="activity-item" key={a.id} to={a.link}>
                        <span className={`activity-dot adot-${a.tone}`} />
                        <div className="activity-main">
                          <div className="activity-text">
                            <strong>{a.label}</strong> — {a.detail}
                          </div>
                        </div>
                        <span className="activity-go">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Bento KPI grid — each tile drills into its module */}
            <div className="bento">
              <Link to="/payments" className="tile tile-hero">
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
              </Link>

              <Link to="/payments?status=overdue" className="tile">
                <div className="t-label">Overdue</div>
                <div className="t-value">{data.summary.overduePayments}</div>
                <div className="t-hint">Payments past due</div>
              </Link>
              <Link to="/deals" className="tile">
                <div className="t-label">Active Deals</div>
                <div className="t-value">{data.summary.activeDeals}</div>
                <div className="t-hint">Revenue-generating</div>
              </Link>
              <Link to="/athletes" className="tile">
                <div className="t-label">Athletes</div>
                <div className="t-value">{data.summary.athleteCount}</div>
                <div className="t-hint">On the roster</div>
              </Link>
              <Link to="/tasks" className="tile">
                <div className="t-label">Open Tasks</div>
                <div className="t-value">{data.summary.openTasks}</div>
                <div className="t-hint">In progress / pending</div>
              </Link>
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
                    <Link className="activity-item" key={a.id} to={a.link}>
                      <span className={`activity-dot adot-${a.tone}`} />
                      <div className="activity-main">
                        <div className="activity-text">
                          <strong>{a.text}</strong> — {a.detail}
                        </div>
                        <div className="activity-meta">{formatDate(a.date)}</div>
                      </div>
                      <span className="activity-go">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </AsyncBoundary>
      </div>
      <aside className="aside">
        <div className="op-aside-block">
          <div className="ab-head">
            <h4>Upcoming</h4>
            <div className="ab-meta">
              {(() => {
                const list = upcomingFrom(data?.activity ?? []);
                return `${list.length} event${list.length === 1 ? '' : 's'}`;
              })()}
            </div>
          </div>
          <UpcomingList events={data?.activity ?? []} />
        </div>
        {data && (
          <div className="op-aside-block">
            <div className="ab-head">
              <h4>At a glance</h4>
              <div className="ab-meta">live</div>
            </div>
            <AsideRow l="Athletes" v={`${data.summary.athleteCount} active`} />
            <AsideRow l="Active deals" v={String(data.summary.activeDeals)} />
            <AsideRow l="Open tasks" v={String(data.summary.openTasks)} />
            <AsideRow
              l="Overdue payments"
              v={String(data.summary.overduePayments)}
              tone={data.summary.overduePayments > 0 ? 'alert' : ''}
            />
            <AsideRow
              l="Outstanding"
              v={formatMoney({ amount: data.summary.outstandingBalance, currency: 'USD' })}
            />
            <AsideRow
              l="Compliance items"
              v={String(data.summary.complianceAlerts)}
              tone={data.summary.complianceAlerts > 0 ? 'warn' : ''}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

interface UpEvent { date: string; text: string; detail: string; tone: string; link: string }
function upcomingFrom(events: UpEvent[]): UpEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return events
    .filter((e) => {
      const d = new Date(`${e.date.slice(0, 10)}T00:00:00`);
      return !Number.isNaN(d.getTime()) && d >= today;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
function shortDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function UpcomingList({ events }: { events: UpEvent[] }) {
  const upcoming = upcomingFrom(events).slice(0, 6);
  if (upcoming.length === 0) {
    return (
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', padding: '8px 0' }}>
        Nothing scheduled.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {upcoming.map((e) => (
        <Link
          key={e.date + e.text + e.detail}
          to={e.link}
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 7px 1fr',
            gap: '0 10px',
            alignItems: 'center',
            padding: '9px 0',
            borderBottom: '1px solid var(--line-soft)',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--text-dim)',
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}
          >
            {shortDate(e.date)}
          </span>
          <span className={'op-dot ' + toneToDot(e.tone)} />
          <span style={{ fontSize: 12.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <strong style={{ fontWeight: 600, color: 'var(--ink)' }}>{e.text}</strong>
            <span style={{ color: 'var(--text-mid)' }}> · {e.detail}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
function toneToDot(tone: string): string {
  switch (tone) {
    case 'red': return 'alert';
    case 'amber': return 'warn';
    case 'green': return 'ok';
    case 'blue': return 'blue';
    default: return '';
  }
}

function AsideRow({ l, v, tone = '' }: { l: string; v: string; tone?: string }) {
  return (
    <div className="ab-row">
      <span className="l">{l}</span>
      <span className={'v ' + tone}>{v}</span>
    </div>
  );
}
