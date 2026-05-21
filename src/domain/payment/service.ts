import type { Payment } from './types';
import type { Deal } from '../deal/types';
import { effectiveStatus } from './rules';

/**
 * Payment domain service — the financial core.
 * Pure: every figure is derived from the payments passed in.
 */

/** Money still owed for one athlete (pending + overdue). */
export function getOutstandingBalance(
  payments: Payment[],
  athleteId: string,
  today: string,
): number {
  return payments
    .filter((p) => p.athleteId === athleteId && effectiveStatus(p, today) !== 'paid')
    .reduce((sum, p) => sum + p.amount.amount, 0);
}

/** Money still owed across the whole (already RBAC-scoped) set. */
export function getTotalOutstanding(payments: Payment[], today: string): number {
  return payments
    .filter((p) => effectiveStatus(p, today) !== 'paid')
    .reduce((sum, p) => sum + p.amount.amount, 0);
}

/** All payments whose effective status is overdue. */
export function getOverduePayments(payments: Payment[], today: string): Payment[] {
  return payments.filter((p) => effectiveStatus(p, today) === 'overdue');
}

/** Total monetary value of overdue payments. */
export function getOverdueAmount(payments: Payment[], today: string): number {
  return getOverduePayments(payments, today).reduce((sum, p) => sum + p.amount.amount, 0);
}

/** Lifetime revenue = sum of all settled (paid) payments. */
export function calculateTotalRevenue(payments: Payment[]): number {
  return payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount.amount, 0);
}

/**
 * Revenue recognised in a calendar month.
 * `yearMonth` is 'YYYY-MM'. Recognition date = the payment's due date.
 */
export function getMonthlyRevenue(payments: Payment[], yearMonth: string): number {
  return payments
    .filter((p) => p.status === 'paid' && p.dueDate.startsWith(yearMonth))
    .reduce((sum, p) => sum + p.amount.amount, 0);
}

/**
 * Build an installment payment schedule for a deal — splits the contract
 * value into `installments` equal pending payments, with due dates spread
 * evenly across the deal term. Each payment is linked back to the deal.
 */
export function buildPaymentSchedule(
  deal: Deal,
  installments: number,
): Omit<Payment, 'id'>[] {
  const n = Math.max(1, Math.floor(installments));
  const total = deal.value.amount;
  const per = Math.round(total / n);
  const start = Date.parse(deal.startDate);
  const span = Date.parse(deal.endDate) - start;

  return Array.from({ length: n }, (_, i) => ({
    athleteId: deal.athleteId,
    dealId: deal.id,
    amount: {
      amount: i === n - 1 ? total - per * (n - 1) : per,
      currency: deal.value.currency,
    },
    dueDate: new Date(start + (span * (i + 1)) / n).toISOString().slice(0, 10),
    status: 'pending' as const,
  }));
}
