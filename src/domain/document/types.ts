import type { ID, ISODate } from '../shared/types';

export type DocumentOwnerType = 'athlete' | 'deal' | 'prospect';

export interface Document {
  id: ID;
  ownerType: DocumentOwnerType;
  ownerId: ID;
  /** e.g. 'contract', 'medical-report', 'id-scan', 'image-rights'. */
  type: string;
  url: string;
  uploadedAt: ISODate;
  /** Optional expiry — drives document expiry tracking. */
  expiresAt?: ISODate;
}
