import type { ID, ISODate, Money } from '../shared/types';

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Payment {
  id: ID;
  athleteId: ID;
  /** Optional link to the deal this payment settles. */
  dealId?: ID;
  amount: Money;
  dueDate: ISODate;
  status: PaymentStatus;
}
