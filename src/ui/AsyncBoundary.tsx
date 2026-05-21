import type { ReactNode } from 'react';

/**
 * Renders the standard loading / error / empty states for any async view.
 *
 * If a `skeleton` node is supplied it is shown while loading (preferred for
 * lists and card grids); otherwise a centered spinner is used. Either way a
 * loading state is always visible against the mock provider's latency.
 */
export function AsyncBoundary({
  loading,
  error,
  isEmpty,
  emptyText,
  skeleton,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  emptyText?: string;
  skeleton?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="state-box">
        <span className="spinner" /> Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-box error-box">
        <span>{error}</span>
        {onRetry && (
          <button className="btn" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return <div className="state-box">{emptyText ?? 'Nothing to show.'}</div>;
  }

  return <>{children}</>;
}
