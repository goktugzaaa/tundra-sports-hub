import type { Athlete } from './types';
import type { Deal } from '../deal/types';
import type { Payment } from '../payment/types';
import { isAvailableToPlay } from './rules';
import { effectiveStatus } from '../payment/rules';

/**
 * Athlete domain service — cross-entity business logic.
 * Pure: collections are passed in, nothing is fetched here.
 */

/** Deals belonging to an athlete. */
export function getAssignedDeals(deals: Deal[], athleteId: string): Deal[] {
  return deals.filter((d) => d.athleteId === athleteId);
}

/** Lifetime revenue for an athlete = sum of their settled (paid) payments. */
export function getTotalRevenue(payments: Payment[], athleteId: string): number {
  return payments
    .filter((p) => p.athleteId === athleteId && p.status === 'paid')
    .reduce((sum, p) => sum + p.amount.amount, 0);
}

/** Money still owed to an athlete (pending + overdue payments). */
export function getOutstandingForAthlete(
  payments: Payment[],
  athleteId: string,
  today: string,
): number {
  return payments
    .filter((p) => p.athleteId === athleteId && effectiveStatus(p, today) !== 'paid')
    .reduce((sum, p) => sum + p.amount.amount, 0);
}

/** Whether an athlete is currently available to compete. */
export function getActiveStatus(athlete: Athlete): boolean {
  return isAvailableToPlay(athlete);
}
