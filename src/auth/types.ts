import type { ID } from '../domain';
import type { Role } from '../rbac/roles';

/**
 * Authenticated principal. `recruiterId` / `athleteId` anchor row-level
 * RBAC scoping for the RECRUITER and ATHLETE roles respectively.
 */
export interface User {
  id: ID;
  name: string;
  role: Role;
  /** Login email — used by auth providers. */
  email?: string;
  /** Set when role === 'RECRUITER'. Equals this user's recruiter identity. */
  recruiterId?: ID;
  /** Set when role === 'ATHLETE'. The athlete record this user owns. */
  athleteId?: ID;
}
