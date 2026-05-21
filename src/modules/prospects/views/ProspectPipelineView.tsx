import { useState } from 'react';
import { PageHeader, AsyncBoundary, TableSkeleton, StatusBadge } from '../../../ui';
import { recruiterName } from '../../../auth/users';
import { prospectRules, prospectsDomain, type ProspectStage } from '../../../domain';
import { useProspects } from '../hooks/useProspects';

const PIPELINE: { stage: ProspectStage; label: string }[] = [
  { stage: 'identified', label: 'Identified' },
  { stage: 'contacted', label: 'Contacted' },
  { stage: 'evaluating', label: 'Evaluating' },
  { stage: 'offer', label: 'Offer' },
  { stage: 'signed', label: 'Signed' },
];

const ORDER: ProspectStage[] = [
  'identified',
  'contacted',
  'evaluating',
  'offer',
  'signed',
  'rejected',
];

/**
 * Prospect recruiting pipeline — a clickable stage rail (the funnel) over
 * a scannable prospect list. Stage transitions go through the prospect
 * domain service via the hook.
 */
export function ProspectPipelineView() {
  const { data, loading, error, reload, canMove, moveStage, movingId, moveError } =
    useProspects();
  const [filter, setFilter] = useState<ProspectStage | 'all'>('all');

  const list = data ?? [];
  const counts = prospectsDomain.stageCounts(list);
  const maxCount = Math.max(1, ...PIPELINE.map((s) => counts[s.stage]));
  const visible = (filter === 'all' ? list : list.filter((p) => p.stage === filter))
    .slice()
    .sort((a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage));

  return (
    <div>
      <PageHeader
        title="Prospects"
        subtitle="Recruiting pipeline — scouted players by stage"
      />

      {moveError && <div className="inline-error">{moveError}</div>}

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<TableSkeleton rows={5} cols={3} />}
        isEmpty={!!data && list.length === 0}
        emptyText="No prospects visible to your role."
      >
        {data && (
          <>
            <div className="section-title">Pipeline</div>
            <div className="pipeline-rail">
              {PIPELINE.map((s) => (
                <button
                  key={s.stage}
                  className={'rail-stage' + (filter === s.stage ? ' active' : '')}
                  onClick={() => setFilter(filter === s.stage ? 'all' : s.stage)}
                >
                  <div className="rs-count">{counts[s.stage]}</div>
                  <div className="rs-label">{s.label}</div>
                  <div className="rs-bar">
                    <i style={{ width: `${(counts[s.stage] / maxCount) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>

            <div className="rail-meta">
              <span>
                {visible.length} prospect{visible.length === 1 ? '' : 's'}
                {filter === 'all' ? '' : ` · ${filter}`}
              </span>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')}>Clear filter</button>
              )}
              {filter !== 'rejected' && counts.rejected > 0 && (
                <button onClick={() => setFilter('rejected')}>
                  {counts.rejected} rejected
                </button>
              )}
            </div>

            <div className="card">
              {visible.length === 0 ? (
                <div className="state-box">No prospects in this stage.</div>
              ) : (
                visible.map((p) => {
                  const next = prospectRules.nextProspectStage(p.stage);
                  const busy = movingId === p.id;
                  const terminal = p.stage === 'signed' || p.stage === 'rejected';
                  return (
                    <div className="prospect-row" key={p.id}>
                      <div className="pr-mark">{p.name.charAt(0)}</div>
                      <div className="pr-body">
                        <div className="pr-line">
                          <span className="pr-name">{p.name}</span>
                          <StatusBadge kind="prospect" value={p.stage} />
                        </div>
                        <div className="pr-sub">{recruiterName(p.assignedRecruiter)}</div>
                        <div className="pr-notes">{p.notes}</div>
                      </div>
                      {!terminal && canMove && (
                        <div className="pr-actions">
                          {next && (
                            <button
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => moveStage(p, next)}
                            >
                              {busy ? 'Moving…' : `Advance to ${next}`}
                            </button>
                          )}
                          <button
                            className="btn"
                            disabled={busy}
                            onClick={() => moveStage(p, 'rejected')}
                          >
                            Reject
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
    </div>
  );
}
