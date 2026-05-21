import type { ProspectStage } from './types';

/** Ordered pipeline. 'rejected' is a terminal off-ramp, not in the line. */
export const PROSPECT_PIPELINE: ProspectStage[] = [
  'identified',
  'contacted',
  'evaluating',
  'offer',
  'signed',
];

export function isActiveProspect(stage: ProspectStage): boolean {
  return stage !== 'signed' && stage !== 'rejected';
}

/** Next stage in the pipeline, or null if at the end / terminal. */
export function nextProspectStage(stage: ProspectStage): ProspectStage | null {
  const i = PROSPECT_PIPELINE.indexOf(stage);
  if (i === -1 || i === PROSPECT_PIPELINE.length - 1) return null;
  return PROSPECT_PIPELINE[i + 1];
}
