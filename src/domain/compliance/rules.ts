import type { ComplianceItem } from './types';

const EXPIRY_WARNING_DAYS = 30;

/** Effective status: a 'valid' item past its expiry date reads as 'expired'. */
export function effectiveComplianceStatus(
  item: ComplianceItem,
  today: string,
): ComplianceItem['status'] {
  if (item.status === 'valid' && item.expiryDate < today) return 'expired';
  return item.status;
}

export function isExpiringSoon(item: ComplianceItem, today: string): boolean {
  if (effectiveComplianceStatus(item, today) !== 'valid') return false;
  const days = daysBetween(today, item.expiryDate);
  return days >= 0 && days <= EXPIRY_WARNING_DAYS;
}

export function needsAttention(item: ComplianceItem, today: string): boolean {
  const s = effectiveComplianceStatus(item, today);
  return s === 'expired' || s === 'flagged' || s === 'pending' || isExpiringSoon(item, today);
}

function daysBetween(from: string, to: string): number {
  const ms = Date.parse(to) - Date.parse(from);
  return Math.round(ms / 86_400_000);
}
