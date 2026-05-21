import type { ReactNode, SVGProps } from 'react';

/* ============================================================
   Tundra Hub — operator-style shared primitives
   Single 14px stroke icon set + small helpers.
   ============================================================ */

const STROKE: SVGProps<SVGSVGElement> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function icon(path: ReactNode, vb = '0 0 16 16') {
  return function Ico(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox={vb} className="ico" width="14" height="14" {...STROKE} {...props}>
        {path}
      </svg>
    );
  };
}

/** Operator icon set — stroke-based, currentColor. */
export const Ic = {
  dashboard: icon(
    <>
      <rect x="2" y="2" width="5" height="6" rx="1" />
      <rect x="9" y="2" width="5" height="3" rx="1" />
      <rect x="9" y="7" width="5" height="7" rx="1" />
      <rect x="2" y="10" width="5" height="4" rx="1" />
    </>,
  ),
  athletes: icon(
    <>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 14c.6-2.7 2.9-4.5 5.5-4.5s4.9 1.8 5.5 4.5" />
    </>,
  ),
  prospects: icon(
    <>
      <path d="M2 13h12M3.5 13V6.5L8 3l4.5 3.5V13" />
      <path d="M6.5 13V9h3v4" />
    </>,
  ),
  deals: icon(
    <>
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" />
      <path d="M2 6.5h12M8 3.5v9" />
    </>,
  ),
  payments: icon(
    <>
      <rect x="2" y="4" width="12" height="8" rx="1" />
      <circle cx="8" cy="8" r="1.8" />
    </>,
  ),
  tasks: icon(
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
      <path d="M5.5 8.5l1.5 1.5 3.5-4" />
    </>,
  ),
  compliance: icon(
    <>
      <path d="M8 1.5l5 2v4.2c0 3-2 5.6-5 6.8-3-1.2-5-3.8-5-6.8V3.5z" />
      <path d="M6 8l1.5 1.5L10.5 6.5" />
    </>,
  ),
  documents: icon(
    <>
      <path d="M3.5 2h6L13 5.5V14H3.5z" />
      <path d="M9.5 2v3.5H13M6 9h5M6 11.5h3.5" />
    </>,
  ),
  settings: icon(
    <>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M1 8h2M13 8h2M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4" />
    </>,
  ),
  search: icon(
    <>
      <circle cx="7" cy="7" r="4" />
      <path d="M10 10l3 3" />
    </>,
  ),
  plus: icon(<path d="M8 3v10M3 8h10" />),
  more: icon(
    <>
      <circle cx="3" cy="8" r="1" />
      <circle cx="8" cy="8" r="1" />
      <circle cx="13" cy="8" r="1" />
    </>,
  ),
  download: icon(<path d="M8 2v9M4 7l4 4 4-4M3 14h10" />),
  upload: icon(<path d="M8 11V2M4 6l4-4 4 4M3 14h10" />),
  bell: icon(
    <>
      <path d="M3.5 12h9l-1-1.5V7.5a3.5 3.5 0 1 0-7 0v3z" />
      <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
    </>,
  ),
  calendar: icon(
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
      <path d="M2.5 6.5h11M5 2v3M11 2v3" />
    </>,
  ),
  chev: icon(<path d="M6 4l4 4-4 4" />),
  filter: icon(<path d="M2 4h12M4 8h8M6 12h4" />),
  arrow: icon(<path d="M3 8h10M9 4l4 4-4 4" />),
  ext: icon(
    <>
      <path d="M6 3H3v10h10V10" />
      <path d="M9 3h4v4M7 9l6-6" />
    </>,
  ),
  warning: icon(
    <>
      <path d="M8 1.5l7 12H1z" />
      <path d="M8 6v4M8 11.5v.5" />
    </>,
  ),
};

/** Square monogram avatar — derives initials from a name. */
export function Avo({ name, className = 'op-avo' }: { name: string; className?: string }) {
  return <span className={className}>{initials(name)}</span>;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type OpTone = '' | 'ok' | 'warn' | 'alert' | 'blue';

/** Status tag — colored dot + single word. The operator status primitive. */
export function StatusTag({ tone, label }: { tone: OpTone; label: string }) {
  return (
    <span className={'op-tag ' + tone}>
      <span className={'op-dot ' + tone} /> {label.replace(/_/g, ' ')}
    </span>
  );
}
