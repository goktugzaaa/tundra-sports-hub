import type { Deal } from './types';
import { isRevenueGenerating } from './rules';

/**
 * Deal domain service — revenue logic.
 * Pure: collections in, numbers/lists out.
 */

/** Total contract value across all of an athlete's deals. */
export function getDealValue(deals: Deal[], athleteId: string): number {
  return deals
    .filter((d) => d.athleteId === athleteId)
    .reduce((sum, d) => sum + d.value.amount, 0);
}

/** Deals currently in the 'active' stage. */
export function getActiveDeals(deals: Deal[]): Deal[] {
  return deals.filter((d) => d.status === 'active');
}

/** Pipeline value = total value of every deal not yet closed. */
export function calculatePipelineValue(deals: Deal[]): number {
  return deals
    .filter((d) => d.status !== 'closed')
    .reduce((sum, d) => sum + d.value.amount, 0);
}

/** Contracted value = value of revenue-generating deals (signed + active). */
export function getContractedValue(deals: Deal[]): number {
  return deals
    .filter(isRevenueGenerating)
    .reduce((sum, d) => sum + d.value.amount, 0);
}
