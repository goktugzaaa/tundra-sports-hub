import type { User } from '../auth/types';
import type { Action, Resource } from './roles';
import { CAPABILITIES, SCOPED_ROLES } from './permissions';

/**
 * Ownership fields of the record being accessed. Whichever the resource
 * carries should be supplied; `canAccess` matches them against the user.
 */
export interface AccessContext {
  /** Owning recruiter of the record (athlete, prospect, deal, ...). */
  recruiterId?: string;
  /** Owning athlete of the record (deal, payment, compliance, ...). */
  athleteId?: string;
}

/**
 * Central permission gate. Two tiers:
 *   1. Capability — does the role have `action` on `resource` at all?
 *   2. Row scope  — for scoped roles, does the record's ownership match?
 *
 * Pure function. Called by module hooks (to gate UI) and by the service
 * layer (defense in depth) — never duplicated inline in components.
 */
export function canAccess(
  user: User,
  resource: Resource,
  action: Action,
  ctx?: AccessContext,
): boolean {
  // Tier 1 — capability.
  const allowed = CAPABILITIES[user.role][resource];
  if (!allowed.includes(action)) return false;

  // Tier 2 — row-level scope. Admins are unscoped.
  if (!SCOPED_ROLES.includes(user.role)) return true;

  // No context => collection-level check (e.g. "can list at all").
  // Capability already passed, so allow; per-row filtering happens elsewhere.
  if (!ctx) return true;

  if (user.role === 'RECRUITER') {
    // A recruiter reaches records they own. Records with no recruiter
    // owner (e.g. payments) fall back to the athlete link being theirs
    // is resolved by the caller passing recruiterId of the linked athlete.
    return ctx.recruiterId !== undefined && ctx.recruiterId === user.recruiterId;
  }

  if (user.role === 'ATHLETE') {
    return ctx.athleteId !== undefined && ctx.athleteId === user.athleteId;
  }

  return false;
}

/** Convenience: filter a list to only the records the user may `read`. */
export function filterReadable<T>(
  user: User,
  resource: Resource,
  rows: T[],
  toCtx: (row: T) => AccessContext,
): T[] {
  return rows.filter((row) => canAccess(user, resource, 'read', toCtx(row)));
}
