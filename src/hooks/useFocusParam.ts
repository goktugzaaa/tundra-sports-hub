import { useSearchParams } from 'react-router-dom';

/**
 * Reads the `?focus=<id>` query param. Modules use it to highlight (and
 * scroll to) the exact record a user drilled into — e.g. from the
 * dashboard activity feed.
 */
export function useFocusParam(): string | null {
  return useSearchParams()[0].get('focus');
}

/** Ref callback that scrolls the focused row into view on mount. */
export function focusScroll(el: HTMLElement | null): void {
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
