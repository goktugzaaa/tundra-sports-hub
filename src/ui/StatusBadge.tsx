import { Badge, type BadgeTone } from './Badge';

/**
 * Unified status badge. One tone source for the whole app — every module
 * renders statuses through this, so badge colours never drift or get
 * redefined per view.
 */
const TONES: Record<string, Record<string, BadgeTone>> = {
  athlete: { active: 'green', injured: 'amber', inactive: 'gray', retired: 'gray' },
  deal: { negotiation: 'amber', signed: 'blue', active: 'green', closed: 'gray' },
  payment: { paid: 'green', pending: 'blue', overdue: 'red' },
  prospect: {
    identified: 'gray',
    contacted: 'blue',
    evaluating: 'blue',
    offer: 'amber',
    signed: 'green',
    rejected: 'red',
  },
  compliance: { valid: 'green', pending: 'amber', expired: 'red', flagged: 'red' },
  task: { open: 'gray', in_progress: 'blue', done: 'green', blocked: 'red' },
  priority: { low: 'gray', medium: 'amber', high: 'red' },
  document: { current: 'green', expiring: 'amber', expired: 'red' },
  owner: { athlete: 'blue', deal: 'green', prospect: 'amber' },
};

export type StatusKind = keyof typeof TONES | string;

export function StatusBadge({ kind, value }: { kind: StatusKind; value: string }) {
  const tone = TONES[kind]?.[value] ?? 'gray';
  return <Badge label={value} tone={tone} />;
}
