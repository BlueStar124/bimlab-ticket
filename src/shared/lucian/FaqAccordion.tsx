/* Lucian UX/UI Prompt #044 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#044 */
// FAQ accordion driven by knowledge-base articles. Only one item opens at a time.
import { useId, useRef, useState } from 'react';
import './lucian-044.css';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  link?: { label: string; onClick: () => void };
}

export function FaqAccordion({ items, initialOpen = 0 }: { items: FaqItem[]; initialOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(initialOpen);
  const uid = useId();
  const qs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKey(e: React.KeyboardEvent, i: number) {
    const n = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -2;
    if (n === -2) return;
    e.preventDefault();
    qs.current[(n + items.length) % items.length]?.focus();
  }

  return (
    <div className="ux u044">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.id} className={`u044-it${isOpen ? ' open' : ''}`}>
            <button
              ref={(el) => {
                qs.current[i] = el;
              }}
              id={`${uid}-q${i}`}
              className="u044-q"
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${uid}-a${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className="u044-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="u044-t">{it.question}</span>
              <span className="u044-pm" aria-hidden="true" />
            </button>
            <div className="u044-body" role="region" id={`${uid}-a${i}`} aria-labelledby={`${uid}-q${i}`}>
              <div>
                <div className="u044-a">
                  <p>{it.answer}</p>
                  {it.link && (
                    <a
                      href="#"
                      tabIndex={isOpen ? 0 : -1}
                      onClick={(e) => {
                        e.preventDefault();
                        it.link?.onClick();
                      }}
                    >
                      {it.link.label} <i aria-hidden="true">→</i>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
