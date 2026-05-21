import type { Deal, DealStatus } from './types';

/** Allowed forward transitions for a deal's lifecycle. */
const TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  negotiation: ['signed', 'closed'],
  signed: ['active', 'closed'],
  active: ['closed'],
  closed: [],
};

export function canTransitionDeal(from: DealStatus, to: DealStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Natural forward status, or null at the end of the lifecycle. */
export function nextDealStatus(status: DealStatus): DealStatus | null {
  const forward: Record<DealStatus, DealStatus | null> = {
    negotiation: 'signed',
    signed: 'active',
    active: 'closed',
    closed: null,
  };
  return forward[status];
}

export function isRevenueGenerating(deal: Deal): boolean {
  return deal.status === 'signed' || deal.status === 'active';
}

/** True if the deal's end date is in the past relative to `today`. */
export function isExpired(deal: Deal, today: string): boolean {
  return deal.endDate < today && deal.status !== 'closed';
}
