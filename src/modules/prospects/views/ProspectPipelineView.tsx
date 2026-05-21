import { useMemo, useState } from 'react';
import { AsyncBoundary } from '../../../ui';
import { Ic, StatusTag, initials, type OpTone } from '../../../ui/ops';
import { recruiterName } from '../../../auth/users';
import { prospectRules, type Prospect, type ProspectStage } from '../../../domain';
import { useProspects } from '../hooks/useProspects';

const STAGE_ORDER: ProspectStage[] = [
  'identified',
  'contacted',
  'evaluating',
  'offer',
  'signed',
  'rejected',
];

const STAGE_LABEL: Record<ProspectStage, string> = {
  identified: 'Identified',
  contacted: 'Contacted',
  evaluating: 'Evaluating',
  offer: 'Offer',
  signed: 'Signed',
  rejected: 'Rejected',
};

const STAGE_TONE: Record<ProspectStage, OpTone> = {
  identified: '',
  contacted: 'blue',
  evaluating: 'blue',
  offer: 'warn',
  signed: 'ok',
  rejected: 'alert',
};

/**
 * Prospects — table-first recruiting pipeline. Stage is a column; rows are
 * grouped by stage with subtotal headers. Stage moves go through the hook.
 */
export function ProspectPipelineView() {
  const { data, loading, error, reload, canMove, canConvert, moveStage, convert, movingId, moveError } =
    useProspects();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | ProspectStage>('all');

  const list = data ?? [];

  const counts = useMemo(() => {
    const c = {} as Record<ProspectStage, number>;
    for (const s of STAGE_ORDER) c[s] = 0;
    for (const p of list) c[p.stage]++;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (stageFilter !== 'all' && p.stage !== stageFilter) return false;
      return true;
    });
  }, [list, search, stageFilter]);

  const groups = useMemo(
    () =>
      STAGE_ORDER.map((stage) => ({
        stage,
        rows: filtered.filter((p) => p.stage === stage),
      })).filter((g) => g.rows.length > 0),
    [filtered],
  );

  return (
    <div className="op-tablepage">
      <div className="op-tp-head">
        <div className="head">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1>Prospects</h1>
            <span className="subtle">
              {filtered.length} of {list.length} shown · grouped by stage
            </span>
          </div>
        </div>

        <div className="op-summary-line">
          <SumItem l="Total" v={String(list.length)} />
          {STAGE_ORDER.filter((s) => s !== 'rejected').map((s) => (
            <span key={s} style={{ display: 'contents' }}>
              <Sep />
              <SumItem
                l={STAGE_LABEL[s]}
                v={String(counts[s])}
                tone={s === 'offer' ? 'warn' : s === 'signed' ? 'ok' : ''}
              />
            </span>
          ))}
        </div>
      </div>

      <div className="op-views">
        <button
          className={'view' + (stageFilter === 'all' ? ' active' : '')}
          onClick={() => setStageFilter('all')}
        >
          All stages <span className="c">{list.length}</span>
        </button>
        {STAGE_ORDER.map((s) => (
          <button
            key={s}
            className={'view' + (stageFilter === s ? ' active' : '')}
            onClick={() => setStageFilter(s)}
          >
            {STAGE_LABEL[s]} <span className="c">{counts[s]}</span>
          </button>
        ))}
      </div>

      <div className="op-tablebar">
        <div className="search">
          <Ic.search />
          <input
            placeholder="Search prospects by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="gap" />
        <span className="results">{filtered.length} results</span>
      </div>

      {moveError && <div className="op-inline-error" style={{ margin: '8px 22px 0' }}>{moveError}</div>}

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && list.length === 0}
        emptyText="No prospects visible to your role."
      >
        <div className="op-tp-scroll">
          <table className="op-dtable">
            <thead>
              <tr>
                <th style={{ width: 26 }} />
                <th>Prospect</th>
                <th>ID</th>
                <th>Stage</th>
                <th>Recruiter</th>
                <th>Notes</th>
                <th className="right" style={{ width: 240 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="dim" style={{ textAlign: 'center', padding: 28 }}>
                    No prospects match these filters.
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <ProspectGroup
                    key={g.stage}
                    stage={g.stage}
                    rows={g.rows}
                    canMove={canMove}
                    canConvert={canConvert}
                    movingId={movingId}
                    onMove={moveStage}
                    onConvert={convert}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      <div className="op-tablefoot" style={{ margin: '0 22px' }}>
        <span>
          {filtered.length} prospect{filtered.length === 1 ? '' : 's'} · grouped by stage
        </span>
      </div>
    </div>
  );
}

function ProspectGroup({
  stage,
  rows,
  canMove,
  canConvert,
  movingId,
  onMove,
  onConvert,
}: {
  stage: ProspectStage;
  rows: Prospect[];
  canMove: boolean;
  canConvert: boolean;
  movingId: string | null;
  onMove: (p: Prospect, stage: ProspectStage) => void;
  onConvert: (p: Prospect) => void;
}) {
  return (
    <>
      <tr className="head">
        <td colSpan={7}>
          {STAGE_LABEL[stage].toUpperCase()} · {rows.length}
        </td>
      </tr>
      {rows.map((p) => {
        const next = prospectRules.nextProspectStage(p.stage);
        const busy = movingId === p.id;
        const terminal = p.stage === 'signed' || p.stage === 'rejected';
        return (
          <tr key={p.id} className={p.stage === 'rejected' ? 'alert' : ''}>
            <td>
              <span className="op-avo">{initials(p.name)}</span>
            </td>
            <td className="strong">{p.name}</td>
            <td>
              <span className="id">{p.id.toUpperCase()}</span>
            </td>
            <td>
              <StatusTag tone={STAGE_TONE[p.stage]} label={p.stage} />
            </td>
            <td>{recruiterName(p.assignedRecruiter)}</td>
            <td className="dim" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.notes || '—'}
            </td>
            <td className="right" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                {!terminal && canMove && next && (
                  <button
                    className="op-btn op-btn-primary"
                    style={{ height: 24, fontSize: 11.5 }}
                    disabled={busy}
                    onClick={() => onMove(p, next)}
                  >
                    {busy ? 'Moving…' : `Advance`}
                  </button>
                )}
                {!terminal && canMove && (
                  <button
                    className="op-btn"
                    style={{ height: 24, fontSize: 11.5 }}
                    disabled={busy}
                    onClick={() => onMove(p, 'rejected')}
                  >
                    Reject
                  </button>
                )}
                {p.stage === 'signed' &&
                  (p.convertedAthleteId ? (
                    <span className="op-tag ok">
                      <span className="op-dot ok" /> Converted
                    </span>
                  ) : (
                    canConvert && (
                      <button
                        className="op-btn op-btn-primary"
                        style={{ height: 24, fontSize: 11.5 }}
                        disabled={busy}
                        onClick={() => onConvert(p)}
                      >
                        {busy ? 'Converting…' : 'Convert to athlete'}
                      </button>
                    )
                  ))}
                {p.stage === 'rejected' && <span className="dim">—</span>}
              </div>
            </td>
          </tr>
        );
      })}
    </>
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
