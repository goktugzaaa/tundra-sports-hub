import type { ID } from '../shared/types';

export type AthleteStatus = 'active' | 'inactive' | 'injured' | 'retired';

export interface AthleteStats {
  sport: string;
  position?: string;
  season?: string;
  /** Sport-agnostic numeric metrics, e.g. { points: 24.1, assists: 6.3 }. */
  metrics: Record<string, number>;
}

export interface Athlete {
  id: ID;
  name: string;
  status: AthleteStatus;
  /** Owning recruiter — drives RBAC row-level scoping. */
  recruiterId: ID;
  stats: AthleteStats;
  /** Extensible non-core fields (agency notes, external refs, etc.). */
  metadata: Record<string, unknown>;
}
