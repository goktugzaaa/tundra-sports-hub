/** Shimmering placeholder bar. */
export function Skeleton({ width = '100%', height = 14 }: { width?: string; height?: number }) {
  return <span className="skeleton" style={{ width, height }} />;
}

/** Table-shaped loading placeholder for list views. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, r) => (
        <div className="skeleton-row" key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? '40%' : '70%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card-grid loading placeholder for summary widgets. */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card stat-card" key={i}>
          <Skeleton width="50%" />
          <div style={{ height: 10 }} />
          <Skeleton width="70%" height={24} />
        </div>
      ))}
    </div>
  );
}
