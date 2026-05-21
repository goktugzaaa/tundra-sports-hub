import type { Athlete, AthleteStatus } from './types';

/** Statuses that count toward an active, billable roster. */
const ROSTERED: AthleteStatus[] = ['active', 'injured'];

export function isRostered(athlete: Athlete): boolean {
  return ROSTERED.includes(athlete.status);
}

export function isAvailableToPlay(athlete: Athlete): boolean {
  return athlete.status === 'active';
}

/** Whether a status transition is allowed by agency policy. */
export function canTransitionStatus(from: AthleteStatus, to: AthleteStatus): boolean {
  if (from === to) return false;
  if (from === 'retired') return false; // retirement is terminal
  return true;
}
