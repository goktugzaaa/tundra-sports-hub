import type { ReactNode } from 'react';

/**
 * Standard loading / error / empty states for any async view.
 * If a `skeleton` node is supplied it is shown while loading; otherwise a
 * centered spinner is used.
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
      <div className="op-state">
        <span className="op-spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="op-state error">
        <span className="glyph">!</span>
        <span>{error}</span>
        {onRetry && (
          <button className="op-btn" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="op-state">
        <span className="glyph">∅</span>
        <span>{emptyText ?? 'Nothing to show.'}</span>
      </div>
    );
  }

  return <>{children}</>;
}
