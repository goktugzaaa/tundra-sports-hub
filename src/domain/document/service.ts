import type { Document, DocumentOwnerType } from './types';
import { isDocumentExpired } from './rules';

/**
 * Document domain service.
 * Pure functions plus `uploadDocumentMock` — a deliberate mock factory
 * standing in for a real file upload until a backend exists.
 */

/** Documents directly owned by an athlete. */
export function getDocumentsByAthlete(docs: Document[], athleteId: string): Document[] {
  return docs.filter((d) => d.ownerType === 'athlete' && d.ownerId === athleteId);
}

/** Documents past their expiry date. */
export function getExpiredDocuments(docs: Document[], today: string): Document[] {
  return docs.filter((d) => isDocumentExpired(d, today));
}

export interface UploadInput {
  ownerType: DocumentOwnerType;
  ownerId: string;
  type: string;
  uploadedAt: string;
  expiresAt?: string;
}

/**
 * Build a new Document record. Mock stand-in for a file upload: the URL
 * is synthetic and the id is generated client-side. Persistence is the
 * caller's job (via the data provider).
 */
export function uploadDocumentMock(input: UploadInput): Document {
  const id = `doc-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    type: input.type,
    url: `mock://docs/${id}.pdf`,
    uploadedAt: input.uploadedAt,
    expiresAt: input.expiresAt,
  };
}
