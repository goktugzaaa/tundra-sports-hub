import type { ID } from '../shared/types';

export type ProspectStage =
  | 'identified'
  | 'contacted'
  | 'evaluating'
  | 'offer'
  | 'signed'
  | 'rejected';

export interface Prospect {
  id: ID;
  name: string;
  stage: ProspectStage;
  /** Recruiter responsible for this prospect — drives RBAC scoping. */
  assignedRecruiter: ID;
  notes: string;
}
