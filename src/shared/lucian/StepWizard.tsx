/* Lucian UX/UI Prompt #042 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#042 */
// Step-by-step wizard. Steps provide their own content and validity; the final circle is the "done" pane.
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import './lucian-042.css';

export interface WizardStep {
  label: string;
  title: string;
  hint: string;
  content: ReactNode;
  valid: boolean;
}

interface Props {
  steps: WizardStep[];
  doneLabel: string;
  done: ReactNode | null;
  submitLabel: string;
  onSubmit: () => void;
  ariaLabel: string;
}

const CHECK = (
  <svg viewBox="0 0 16 16">
    <path d="M3.5 8.4l3 3 6-6.4" />
  </svg>
);

export function StepWizard({ steps, doneLabel, done, submitLabel, onSubmit, ariaLabel }: Props) {
  const [cur, setCur] = useState(0);
  const prevCur = useRef(-1);
  const viewRef = useRef<HTMLDivElement>(null);
  const total = steps.length + 1;
  const active = done ? steps.length : cur;
  const isSubmitStep = active === steps.length - 1;

  // Slide the incoming pane in from the side it comes from (same motion as the original script).
  useLayoutEffect(() => {
    const prev = prevCur.current;
    prevCur.current = active;
    if (prev < 0 || prev === active) return;
    const dir = active > prev ? 1 : -1;
    const pane = viewRef.current?.children[active] as HTMLElement | undefined;
    if (!pane) return;
    pane.style.transition = 'none';
    pane.style.transform = `translateX(${dir * 40}%)`;
    pane.style.opacity = '0';
    void pane.offsetWidth;
    pane.style.transition = '';
    pane.style.transform = 'none';
    pane.style.opacity = '1';
  }, [active]);

  const labels = [...steps.map((s) => s.label), doneLabel];

  return (
    <div className={`ux u042${isSubmitStep ? ' is-last' : ''}`}>
      <ol className="u042-steps" aria-label={ariaLabel}>
        <li className="u042-line" aria-hidden="true" style={{ ['--p' as string]: (active / (total - 1)).toFixed(3) }}>
          <i />
        </li>
        {labels.map((label, k) => {
          const state = k < active ? 'done' : k === active ? 'cur' : '';
          const canGoBack = k < active && !done;
          return (
            <li key={label} className={`u042-st ${state}`}>
              <button
                className="u042-dot"
                type="button"
                tabIndex={canGoBack ? 0 : -1}
                aria-current={k === active ? 'step' : undefined}
                aria-label={`Bước ${k + 1}, ${label}${k < active ? ', đã xong' : k === active ? ', bước hiện tại' : ''}`}
                onClick={() => canGoBack && setCur(k)}
              >
                <span>{k + 1}</span>
                {CHECK}
              </button>
              <small>{label}</small>
            </li>
          );
        })}
      </ol>
      <div className="u042-view" ref={viewRef} aria-live="polite">
        {steps.map((s, k) => (
          <section
            key={s.label}
            className={`u042-pane${k === active ? ' on' : ''}`}
            aria-hidden={k !== active}
            style={k === active ? undefined : { opacity: 0, transform: `translateX(${k < active ? -40 : 40}%)` }}
          >
            <h4>{s.title}</h4>
            <p>{s.hint}</p>
            {s.content}
          </section>
        ))}
        <section
          className={`u042-pane${done ? ' on' : ''}`}
          aria-hidden={!done}
          style={done ? undefined : { opacity: 0, transform: 'translateX(40%)' }}
        >
          <div className="u042-done">
            <span className="u042-big">
              <svg viewBox="0 0 34 34">
                <path d="M9 17.5l5.5 5.5L25.5 12" />
              </svg>
            </span>
            {done}
          </div>
        </section>
      </div>
      {!done && (
        <div className="u042-foot">
          <span className="u042-hint">
            Bước {active + 1}/{steps.length}
          </span>
          <button className="u042-b u042-prev" type="button" aria-disabled={active === 0} onClick={() => active > 0 && setCur(active - 1)}>
            Quay lại
          </button>
          <button
            className="u042-b u042-next"
            type="button"
            disabled={!steps[active].valid}
            onClick={() => (isSubmitStep ? onSubmit() : setCur(active + 1))}
          >
            {isSubmitStep ? submitLabel : 'Tiếp tục'}
          </button>
        </div>
      )}
    </div>
  );
}
