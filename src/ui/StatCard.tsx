import type { ReactNode } from 'react';

/**
 * KPI card. `hint` adds a contextual sub-line; `accent` marks the hero
 * metric (accent value + top accent rule).
 */
export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={'card stat-card' + (accent ? ' accent' : '')}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint !== undefined && <div className="hint">{hint}</div>}
    </div>
  );
}
