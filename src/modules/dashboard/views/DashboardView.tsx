import { Link } from 'react-router-dom';
import { AsyncBoundary } from '../../../ui';
import { Ic } from '../../../ui/ops';
import { formatMoney } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { useDashboard } from '../hooks/useDashboard';
import type { ActionItem } from '../actionQueue';
import type { ActivityItem } from '../activity';

/** ActionItem tone (red/amber/blue) → operator dot tone. */
const ACTION_TONE: Record<ActionItem['tone'], string> = {
  red: 'alert',
  amber: 'warn',
  blue: 'blue',
};
const ACTION_URG: Record<ActionItem['tone'], string> = {
  red: 'action',
  amber: 'soon',
  blue: 'review',
};
const ACTIVITY_TONE: Record<ActivityItem['tone'], string> = {
  red: 'alert',
  amber: 'warn',
  green: 'ok',
  blue: 'blue',
  gray: '',
};

/** Today — the operator inbox: one queue of what needs attention + a sparse aside. */
export function DashboardView() {
  const { data, loading, error, reload } = useDashboard();

  return (
    <div className="op-page with-aside">
      <div className="primary">
        <div className="op-banner">
          <Ic.warning {...{ className: 'b-ico' }} />
          <span className="b-body">
            <b>May reconciliation due Friday 17:00.</b> Invoices need sign-off.
          </span>
        </div>

        <div className="op-pagehead">
          <div>
            <h1>Today</h1>
            <div className="sub">What needs your attention</div>
          </div>
          <div className="actions">
            <Link to="/tasks" className="op-btn">
              <Ic.tasks /> Tasks
            </Link>
            <Link to="/athletes" className="op-btn op-btn-primary">
              <Ic.plus /> Add athlete
            </Link>
          </div>
        </div>

        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <div className="op-h">
                <h3>Needs attention</h3>
                <div className="h-meta">
                  <b>{data.actionQueue.length}</b> open
                </div>
              </div>
              <div className="op-queue">
                {data.actionQueue.length === 0 ? (
                  <div className="op-state">
                    <span className="glyph">∅</span>
                    <span>Nothing waiting on you — the queue is clear.</span>
                  </div>
                ) : (
                  data.actionQueue.map((a) => (
                    <Link key={a.id} to={a.link} className={'qrow ' + ACTION_TONE[a.tone]}>
                      <span className={'op-dot ' + ACTION_TONE[a.tone]} />
                      <span className="urg">{ACTION_URG[a.tone]}</span>
                      <span className="who">{a.label}</span>
                      <span className="what">{a.detail}</span>
                      <span className="amount">
                        <Ic.chev />
                      </span>
                    </Link>
                  ))
                )}
              </div>

              <div className="op-h" style={{ marginTop: 26 }}>
                <h3>Recent activity</h3>
                <div className="h-meta">last events</div>
              </div>
              <div className="op-queue">
                {data.activity.map((a) => (
                  <Link key={a.id} to={a.link} className="qrow">
                    <span className={'op-dot ' + ACTIVITY_TONE[a.tone]} />
                    <span className="urg" style={{ color: 'var(--text-dim)' }}>
                      {formatDate(a.date).replace(/,? \d{4}$/, '')}
                    </span>
                    <span className="who">{a.text}</span>
                    <span className="what">{a.detail}</span>
                    <span className="amount">
                      <Ic.chev />
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </AsyncBoundary>
      </div>

      <div className="aside">
        <div className="op-note-pin" style={{ marginBottom: 22 }}>
          PM huddle moved to <b>09:00 daily</b> starting June — leadership floor only. Recruiters
          keep their 11:00 stand-up.
          <div className="pin-meta">— M. Aktaş, 12 May</div>
        </div>

        <div className="op-aside-block">
          <div className="ab-head">
            <h4>This week</h4>
            <div className="ab-meta">19 — 25 May</div>
          </div>
          <div className="op-week">
            <Day d="MON 19" e="Reed × Nike call · 14:30" />
            <Day d="TUE 20" e="Vega medical · 10:00" />
            <Day d="WED 21" e="Today" today />
            <Day d="THU 22" e="Sato W-9 deadline" />
            <Day d="FRI 23" e="Q2 reconciliation" />
            <Day d="SAT 24" e="—" muted />
            <Day d="SUN 25" e="Financial close" />
          </div>
        </div>

        {data && (
          <div className="op-aside-block">
            <div className="ab-head">
              <h4>At a glance</h4>
              <div className="ab-meta">live</div>
            </div>
            <Row l="Athletes" v={`${data.summary.athleteCount} active`} />
            <Row l="Active deals" v={String(data.summary.activeDeals)} />
            <Row l="Open tasks" v={String(data.summary.openTasks)} />
            <Row
              l="Overdue payments"
              v={String(data.summary.overduePayments)}
              tone={data.summary.overduePayments > 0 ? 'alert' : ''}
            />
            <Row
              l="Outstanding"
              v={formatMoney({ amount: data.summary.outstandingBalance, currency: 'USD' })}
            />
            <Row
              l="Compliance items"
              v={String(data.summary.complianceAlerts)}
              tone={data.summary.complianceAlerts > 0 ? 'warn' : ''}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Day({ d, e, today, muted }: { d: string; e: string; today?: boolean; muted?: boolean }) {
  return (
    <div className={'day' + (today ? ' today' : '')}>
      <span className="d">{d}</span>
      <span className={'e' + (muted ? ' muted' : '')}>{e}</span>
    </div>
  );
}

function Row({ l, v, tone = '' }: { l: string; v: string; tone?: string }) {
  return (
    <div className="ab-row">
      <span className="l">{l}</span>
      <span className={'v ' + tone}>{v}</span>
    </div>
  );
}
