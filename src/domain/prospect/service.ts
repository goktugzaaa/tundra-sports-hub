import type { Prospect, ProspectStage } from './types';
import { err, ok, type Result } from '../shared/types';

/**
 * Prospect domain service — pipeline operations.
 * Pure: returns new entities / derived lists, never mutates or fetches.
 */

/** All prospects currently sitting in a given stage. */
export function getProspectsByStage(
  prospects: Prospect[],
  stage: ProspectStage,
): Prospect[] {
  return prospects.filter((p) => p.stage === stage);
}

/**
 * Produce an updated prospect moved to `newStage`.
 * 'signed' is terminal — a signed prospect cannot be moved back.
 */
export function moveProspectStage(
  prospect: Prospect,
  newStage: ProspectStage,
): Result<Prospect> {
  if (prospect.stage === newStage) {
    return err('Prospect is already in that stage.');
  }
  if (prospect.stage === 'signed') {
    return err('A signed prospect cannot change stage.');
  }
  return ok({ ...prospect, stage: newStage });
}

/** Count of prospects per stage — for pipeline summary widgets. */
export function stageCounts(prospects: Prospect[]): Record<ProspectStage, number> {
  const counts: Record<ProspectStage, number> = {
    identified: 0,
    contacted: 0,
    evaluating: 0,
    offer: 0,
    signed: 0,
    rejected: 0,
  };
  for (const p of prospects) counts[p.stage] += 1;
  return counts;
}
