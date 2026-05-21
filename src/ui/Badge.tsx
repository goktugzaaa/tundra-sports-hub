export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'gray';

export function Badge({ label, tone }: { label: string; tone: BadgeTone }) {
  return <span className={`badge badge-${tone}`}>{label.replace(/_/g, ' ')}</span>;
}
