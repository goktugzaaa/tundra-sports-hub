import type { ComplianceItem } from './types';
import { effectiveComplianceStatus, needsAttention, isExpiringSoon } from './rules';

/**
 * Compliance domain service — regulatory tracking + alerting.
 * Pure: collections in, derived lists / summaries out.
 */

/** Items whose effective status is expired. */
export function getExpiredItems(items: ComplianceItem[], today: string): ComplianceItem[] {
  return items.filter((i) => effectiveComplianceStatus(i, today) === 'expired');
}

/** Items still awaiting clearance for a given athlete. */
export function getPendingCompliance(
  items: ComplianceItem[],
  athleteId: string,
): ComplianceItem[] {
  return items.filter((i) => i.athleteId === athleteId && i.status === 'pending');
}

/** Items expiring within the warning window. */
export function getExpiringSoon(items: ComplianceItem[], today: string): ComplianceItem[] {
  return items.filter((i) => isExpiringSoon(i, today));
}

export interface ComplianceStatusSummary {
  status: 'clear' | 'attention';
  alerts: number;
}

/** Overall compliance health for one athlete. */
export function getComplianceStatus(
  items: ComplianceItem[],
  athleteId: string,
  today: string,
): ComplianceStatusSummary {
  const alerts = items.filter(
    (i) => i.athleteId === athleteId && needsAttention(i, today),
  ).length;
  return { status: alerts > 0 ? 'attention' : 'clear', alerts };
}

/** Patch that clears a pending or flagged item to valid. */
export function clearComplianceItem(): Partial<ComplianceItem> {
  return { status: 'valid' };
}

/** Patch that renews an item — valid status + a fresh expiry date. */
export function renewComplianceItem(newExpiry: string): Partial<ComplianceItem> {
  return { status: 'valid', expiryDate: newExpiry };
}

/** Whether an item is digitally resolvable from the dashboard. */
export function isResolvable(item: ComplianceItem, today: string): boolean {
  const s = effectiveComplianceStatus(item, today);
  return s === 'pending' || s === 'flagged' || s === 'expired';
}
