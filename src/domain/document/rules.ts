import type { Document } from './types';

const EXPIRY_WARNING_DAYS = 45;

export function isDocumentExpired(doc: Document, today: string): boolean {
  return doc.expiresAt !== undefined && doc.expiresAt < today;
}

export function isDocumentExpiringSoon(doc: Document, today: string): boolean {
  if (doc.expiresAt === undefined || isDocumentExpired(doc, today)) return false;
  const days = Math.round((Date.parse(doc.expiresAt) - Date.parse(today)) / 86_400_000);
  return days <= EXPIRY_WARNING_DAYS;
}
