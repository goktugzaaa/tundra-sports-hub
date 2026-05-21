import type { ID, ISODate } from '../shared/types';

export type ComplianceStatus = 'valid' | 'pending' | 'expired' | 'flagged';

export interface ComplianceItem {
  id: ID;
  athleteId: ID;
  /** e.g. 'medical', 'eligibility', 'visa', 'doping-test', 'contract-review'. */
  type: string;
  status: ComplianceStatus;
  expiryDate: ISODate;
}
