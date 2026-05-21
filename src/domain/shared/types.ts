/**
 * Shared domain primitives. Pure types — no framework, no I/O.
 */

export type ID = string;

/** ISO calendar date, 'YYYY-MM-DD'. */
export type ISODate = string;

export interface Money {
  amount: number;
  currency: string;
}

/** Result of an operation that can fail without throwing. */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T>(error: string): Result<T> => ({ ok: false, error });
