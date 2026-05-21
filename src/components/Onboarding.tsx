import { useLayoutEffect, useRef, useState } from 'react';

const SEEN_KEY = 'tundra:onboarded:v2';
const CARD_W = 372;

interface Step {
  /** CSS selector of the element to spotlight. Omit for a centered card. */
  target?: string;
  place?: 'right' | 'left' | 'bottom';
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    eyebrow: 'Welcome',
    title: 'This is Tundra Hub',
    body: 'Your agency’s internal operations workspace. A 20-second walk through where everything lives.',
  },
  {
    target: '.op-side',
    place: 'right',
    eyebrow: 'Step 1 · Modules',
    title: 'Everything sits in the left rail',
    body: 'Nine modules grouped by purpose — Work, Roster, Revenue, Governance. One click to each.',
  },
  {
    target: '.op-top .search',
    place: 'bottom',
    eyebrow: 'Step 2 · Search',
    title: 'Jump anywhere with ⌘K',
    body: 'Press ⌘K (or Ctrl+K) at any time to search every athlete, deal and invoice you can see.',
  },
  {
    target: '.op-queue',
    place: 'right',
    eyebrow: 'Step 3 · Today',
    title: 'Your attention queue',
    body: 'Overdue payments, compliance flags and deals to close — work this list top to bottom.',
  },
  {
    target: '.aside',
    place: 'left',
    eyebrow: 'Step 4 · Context',
    title: 'A sparse, factual aside',
    body: 'This week’s schedule and live agency numbers stay in view here — supporting the queue, never crowding it.',
  },
];

/**
 * First-run guided tour — spotlights real panel areas one step at a time
 * with a popover anchored beside each. Shown once; dismissal persists.
 */
export function Onboarding() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Measure the spotlight target — synchronously, then on resize / scroll.
  useLayoutEffect(() => {
    if (!open) return;
    function measure() {
      const el = s.target ? document.querySelector(s.target) : null;
      setRect(el ? el.getBoundingClientRect() : null);
    }
    const el = s.target ? document.querySelector(s.target) : null;
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, open, s.target]);

  // Position the popover beside the target (clamped to the viewport).
  useLayoutEffect(() => {
    if (!open) return;
    const h = cardRef.current?.offsetHeight ?? 210;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top: number;
    let left: number;
    if (!rect) {
      top = (vh - h) / 2;
      left = (vw - CARD_W) / 2;
    } else if (s.place === 'right') {
      left = rect.right + 16;
      top = rect.top;
    } else if (s.place === 'left') {
      left = rect.left - CARD_W - 16;
      top = rect.top;
    } else {
      top = rect.bottom + 14;
      left = rect.left;
    }
    left = Math.max(14, Math.min(left, vw - CARD_W - 14));
    top = Math.max(14, Math.min(top, vh - h - 14));
    setPos({ top, left });
  }, [rect, step, open]);

  if (!open) return null;

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable — harmless, tour just shows again */
    }
    setOpen(false);
  }

  return (
    <div className="op-tour">
      <div className="op-tour-block" />
      {rect ? (
        <div
          className="op-tour-spot"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      ) : (
        <div className="op-tour-dim" />
      )}

      <div
        className="op-tour-card"
        ref={cardRef}
        style={pos ? { top: pos.top, left: pos.left } : { opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="tc-head">
          <span className="tc-step">
            {step + 1} / {STEPS.length}
          </span>
          <button className="tc-skip" onClick={close}>
            Skip tour
          </button>
        </div>
        <div className="tc-body" key={step}>
          <div className="tc-eyebrow">{s.eyebrow}</div>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </div>
        <div className="tc-foot">
          <div className="tc-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={'dot' + (i === step ? ' on' : i < step ? ' done' : '')} />
            ))}
          </div>
          <div className="tc-actions">
            {step > 0 && (
              <button className="op-btn" onClick={() => setStep((v) => v - 1)}>
                Back
              </button>
            )}
            {isLast ? (
              <button className="op-btn op-btn-primary" onClick={close}>
                Done
              </button>
            ) : (
              <button className="op-btn op-btn-primary" onClick={() => setStep((v) => v + 1)}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
