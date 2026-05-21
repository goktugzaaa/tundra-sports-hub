import { Link, useParams } from 'react-router-dom';
import { PageHeader, AsyncBoundary, StatCard, CardSkeleton, StatusBadge } from '../../../ui';
import { formatMoney } from '../../../utils/format';
import { formatDate, todayISO } from '../../../utils/date';
import { paymentRules, paymentsDomain } from '../../../domain';
import { useDealDetail } from '../hooks/useDealDetail';

/** NIL deal detail — the deal plus its linked payment schedule and documents. */
export function DealDetailView() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useDealDetail(id);
  const today = todayISO();

  return (
    <div className="op-legacy">
      <PageHeader
        title={data ? `${data.athleteName} — NIL Deal` : 'NIL Deal'}
        subtitle="Contract, payment schedule and documents"
        actions={
          <Link className="btn" to="/deals">
            ← Back
          </Link>
        }
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<CardSkeleton count={3} />}
        isEmpty={data === null}
        emptyText="Deal not found."
      >
        {data && (
          <>
            <div className="grid grid-3">
              <StatCard label="Contract Value" value={formatMoney(data.deal.value)} />
              <StatCard
                label="Scheduled"
                value={formatMoney({
                  amount: data.payments.reduce((s, p) => s + p.amount.amount, 0),
                  currency: data.deal.value.currency,
                })}
              />
              <StatCard
                label="Collected"
                value={formatMoney({
                  amount: paymentsDomain.calculateTotalRevenue(data.payments),
                  currency: data.deal.value.currency,
                })}
              />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14 }}>
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Contract</h3>
                <div className="detail-row">
                  <span className="k">Status</span>
                  <StatusBadge kind="deal" value={data.deal.status} />
                </div>
                <div className="detail-row">
                  <span className="k">Athlete</span>
                  <span>{data.athleteName}</span>
                </div>
                <div className="detail-row">
                  <span className="k">Start</span>
                  <span>{formatDate(data.deal.startDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="k">End</span>
                  <span>{formatDate(data.deal.endDate)}</span>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Documents</h3>
                {data.documents.length === 0 ? (
                  <div className="muted">No documents linked to this deal.</div>
                ) : (
                  data.documents.map((d) => (
                    <div className="detail-row" key={d.id}>
                      <span className="k">{d.type}</span>
                      <span className="mono">{d.url}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="section-title">Payment Schedule</div>
            <div className="card">
              {data.payments.length === 0 ? (
                <div className="state-box">No payments scheduled for this deal.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => {
                      const eff = paymentRules.effectiveStatus(p, today);
                      return (
                        <tr key={p.id} className={eff === 'overdue' ? 'row-overdue' : undefined}>
                          <td>
                            <span className="mono">INV-{p.id.toUpperCase()}</span>
                          </td>
                          <td className={eff === 'overdue' ? 'amount-overdue' : undefined}>
                            {formatMoney(p.amount)}
                          </td>
                          <td>{formatDate(p.dueDate)}</td>
                          <td>
                            <StatusBadge kind="payment" value={eff} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
