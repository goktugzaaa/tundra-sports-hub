import { useState, type ReactNode } from 'react';
import { Ic } from '../ui/ops';

const SEEN_KEY = 'tundra:onboarded:v1';

interface Step {
  icon: keyof typeof Ic;
  eyebrow: string;
  title: string;
  body: ReactNode;
}

const STEPS: Step[] = [
  {
    icon: 'dashboard',
    eyebrow: 'Welcome',
    title: 'This is Tundra Hub',
    body: 'Your agency’s internal operations workspace — athletes, deals, payments and compliance in one place. Here’s a 30-second tour of what’s inside.',
  },
  {
    icon: 'dashboard',
    eyebrow: 'Step 1 · Today',
    title: 'Start your day at Today',
    body: 'The Today queue surfaces what needs you right now — overdue payments, compliance flags, deals to close. Work it top to bottom and the day is handled.',
  },
  {
    icon: 'athletes',
    eyebrow: 'Step 2 · Modules',
    title: 'Nine modules, one rail',
    body: 'Athletes, Prospects, NIL deals, Payments, Tasks, Compliance and Documents live in the left sidebar — grouped by what they’re for. Every list is a dense, scannable table.',
  },
  {
    icon: 'payments',
    eyebrow: 'Step 3 · Records',
    title: 'Detail opens in a drawer',
    body: 'Click any table row and the full record slides in from the right. The table stays put — no page reloads, no lost context, no modal stacks.',
  },
  {
    icon: 'search',
    eyebrow: 'Step 4 · Speed',
    title: 'Jump anywhere with ⌘K',
    body: 'Press ⌘K (or Ctrl+K) at any time to search every athlete, deal, invoice and task you have access to. Keyboard-first, always one shortcut away.',
  },
];

/**
 * First-run onboarding — a short stepped introduction shown once when a
 * user first enters the panel. Dismissal is persisted in localStorage.
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

  if (!open) return null;

  const s = STEPS[step];
  const Icon = Ic[s.icon];
  const isLast = step === STEPS.length - 1;

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable — show again next visit, harmless */
    }
    setOpen(false);
  }

  return (
    <div className="op-onb-backdrop">
      <div className="op-onb" role="dialog" aria-modal="true" aria-label="Welcome to Tundra Hub">
        <div className="op-onb-head">
          <span className="op-onb-step">
            {step + 1} / {STEPS.length}
          </span>
          <button className="op-onb-skip" onClick={close}>
            Skip tour
          </button>
        </div>

        <div className="op-onb-body" key={step}>
          <div className="op-onb-ico">
            <Icon width={20} height={20} />
          </div>
          <div className="op-onb-eyebrow">{s.eyebrow}</div>
          <h2>{s.title}</h2>
          <p>{s.body}</p>
        </div>

        <div className="op-onb-foot">
          <div className="op-onb-dots">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={'dot' + (i === step ? ' on' : i < step ? ' done' : '')}
              />
            ))}
          </div>
          <div className="op-onb-actions">
            {step > 0 && (
              <button className="op-btn" onClick={() => setStep((v) => v - 1)}>
                Back
              </button>
            )}
            {isLast ? (
              <button className="op-btn op-btn-primary" onClick={close}>
                Enter Tundra Hub →
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
