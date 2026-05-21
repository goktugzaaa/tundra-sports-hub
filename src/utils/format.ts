import type { Money } from '../domain';

/**
 * Locale is pinned to 'en-US' so currency rendering is deterministic
 * across machines — never inherits the OS locale (which produced
 * wrong-looking output like "$200.000").
 */
const LOCALE = 'en-US';

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

/** Compact money for tight cells, e.g. $2.4M. */
export function formatMoneyCompact(money: Money): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: money.currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(money.amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(LOCALE).format(n);
}
