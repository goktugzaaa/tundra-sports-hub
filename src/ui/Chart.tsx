/**
 * Dependency-free charts — hand-built SVG / CSS. No charting library,
 * keeps the bundle lean and the visual language fully on-brand.
 */

export type ChartTone = 'blue' | 'green' | 'amber' | 'red' | 'gray';

const TONE_VAR: Record<ChartTone, string> = {
  blue: 'var(--accent)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  gray: 'var(--surface-3)',
};

// ── Horizontal bar chart ──────────────────────────────────────────
export interface BarDatum {
  label: string;
  value: number;
  /** Right-aligned caption (e.g. formatted money). Defaults to value. */
  caption?: string;
  tone?: ChartTone;
}

export function BarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="barchart">
      {data.map((d) => (
        <div className="bar-row" key={d.label}>
          <div className="bar-head">
            <span>{d.label}</span>
            <span className="muted">{d.caption ?? d.value}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: TONE_VAR[d.tone ?? 'blue'],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────
export interface DonutSegment {
  label: string;
  value: number;
  tone: ChartTone;
}

export function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" className="donut-svg">
        <g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="15" />
          {segments.map((seg) => {
            const len = (seg.value / total) * C;
            const node = (
              <circle
                key={seg.label}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={TONE_VAR[seg.tone]}
                strokeWidth="15"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
              />
            );
            acc += len;
            return node;
          })}
        </g>
        <text x="60" y="56" textAnchor="middle" className="donut-value">
          {centerValue}
        </text>
        <text x="60" y="72" textAnchor="middle" className="donut-label">
          {centerLabel}
        </text>
      </svg>
      <div className="donut-legend">
        {segments.map((seg) => (
          <div className="legend-row" key={seg.label}>
            <span className="legend-dot" style={{ background: TONE_VAR[seg.tone] }} />
            <span className="legend-label">{seg.label}</span>
            <span className="legend-value">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
