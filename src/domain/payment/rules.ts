import type { Payment } from './types';

/**
 * Effective status: a 'pending' payment past its due date reads as 'overdue'.
 * Stored status is never mutated here — this is a pure derivation.
 */
export function effectiveStatus(payment: Payment, today: string): Payment['status'] {
  if (payment.status === 'pending' && payment.dueDate < today) return 'overdue';
  return payment.status;
}

export function isOverdue(payment: Payment, today: string): boolean {
  return effectiveStatus(payment, today) === 'overdue';
}

/** Sum of amounts not yet paid. Assumes a single currency across the set. */
export function outstandingBalance(payments: Payment[], today: string): number {
  return payments
    .filter((p) => effectiveStatus(p, today) !== 'paid')
    .reduce((sum, p) => sum + p.amount.amount, 0);
}

export function totalPaid(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount.amount, 0);
}
