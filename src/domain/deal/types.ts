import type { ID, ISODate, Money } from '../shared/types';

export type DealStatus = 'negotiation' | 'signed' | 'active' | 'closed';

export interface Deal {
  id: ID;
  athleteId: ID;
  value: Money;
  status: DealStatus;
  startDate: ISODate;
  endDate: ISODate;
}
