import type { ReactNode } from 'react';

/**
 * Minimal line-icon set for navigation. Stroke-based, currentColor —
 * inherits nav-link colour. Keeps the sidebar from reading as a plain
 * text list (a key "not generic" signal).
 */
function svg(children: ReactNode) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const navIcons: Record<string, ReactNode> = {
  dashboard: svg(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>,
  ),
  athletes: svg(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </>,
  ),
  prospects: svg(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.2" />
    </>,
  ),
  deals: svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.4 9.6h4.2M9.4 14.2h4.2" />
    </>,
  ),
  payments: svg(
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
    </>,
  ),
  tasks: svg(
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 12.2l3 3 5-6" />
    </>,
  ),
  compliance: svg(
    <>
      <path d="M12 3l8 3v5.5c0 5-3.4 8.3-8 9.5-4.6-1.2-8-4.5-8-9.5V6z" />
    </>,
  ),
  documents: svg(
    <>
      <path d="M3.5 7a2 2 0 012-2h4.2l2 2.2h6.8a2 2 0 012 2v8.8a2 2 0 01-2 2H5.5a2 2 0 01-2-2z" />
    </>,
  ),
  settings: svg(
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.5 5.5l-2 2M7.5 16.5l-2 2M18.5 18.5l-2-2M7.5 7.5l-2-2" />
    </>,
  ),
};
