import type { User } from './types';

/**
 * Demo principals. With no real auth backend, these stand in for logged-in
 * users and power the role switcher so RBAC can be exercised live.
 *
 * In a real system this list would come from an identity provider; the
 * rest of the app neither knows nor cares about the difference.
 */
export const DEMO_USERS: User[] = [
  { id: 'u-admin', name: 'Dana Cross', role: 'ADMIN', email: 'admin@tundra.dev' },
  { id: 'u-rec-1', name: 'Sarah Chen', role: 'RECRUITER', recruiterId: 'rec-1', email: 'sarah@tundra.dev' },
  { id: 'u-rec-2', name: 'Mike Torres', role: 'RECRUITER', recruiterId: 'rec-2', email: 'mike@tundra.dev' },
  { id: 'u-ath-1', name: 'Marcus Bennett', role: 'ATHLETE', athleteId: 'ath-1', email: 'marcus@tundra.dev' },
];

export const DEFAULT_USER: User = DEMO_USERS[0];

/** Display name for a recruiter id, e.g. 'rec-1' -> 'Sarah Chen'. */
export function recruiterName(recruiterId: string): string {
  const match = DEMO_USERS.find((u) => u.recruiterId === recruiterId);
  return match?.name ?? recruiterId;
}
