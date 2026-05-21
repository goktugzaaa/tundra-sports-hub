import type { Action, Resource, Role } from './roles';

/** Capability tier — which actions a role may perform on a resource type. */
type Capability = Record<Resource, Action[]>;

const FULL: Action[] = ['create', 'read', 'update', 'delete'];
const WRITE: Action[] = ['create', 'read', 'update'];
const READ: Action[] = ['read'];

/**
 * Role → resource → allowed actions.
 * This is the *capability* check only. Row-level ownership scoping is
 * applied separately in `canAccess` via the AccessContext.
 */
export const CAPABILITIES: Record<Role, Capability> = {
  ADMIN: {
    athlete: FULL,
    prospect: FULL,
    deal: FULL,
    payment: FULL,
    task: FULL,
    compliance: FULL,
    document: FULL,
  },
  RECRUITER: {
    athlete: WRITE,
    prospect: WRITE,
    deal: WRITE,
    payment: READ,
    task: WRITE,
    compliance: WRITE,
    document: WRITE,
  },
  ATHLETE: {
    athlete: READ,
    prospect: [],
    deal: READ,
    payment: READ,
    // Athletes may advance their own task status (scoped in the service layer).
    task: ['read', 'update'],
    compliance: READ,
    document: READ,
  },
};

/** Roles whose access is restricted to records they own. */
export const SCOPED_ROLES: Role[] = ['RECRUITER', 'ATHLETE'];
