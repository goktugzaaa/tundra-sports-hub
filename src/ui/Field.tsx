import type { ReactNode } from 'react';

/** Labelled form field — standardises modal form layout. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
