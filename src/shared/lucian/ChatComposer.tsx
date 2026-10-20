/* Lucian UX/UI Prompt #078 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#078 */
/* Lucian UX/UI Prompt #268 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#268 */
// Composer of #078 (reply quote that rises above the bar, send button that lights up when there is text)
// with the @mention list of #268 (filters as you type, ↑ ↓ to choose, Enter/Tab to insert, avatars of
// the people who will be notified). Adapted: the list opens above the input because the composer sits at
// the bottom of the page; matching ignores Vietnamese diacritics; the mic state of #078 is a dimmed send icon.
import { type FormEvent, type KeyboardEvent, useId, useRef, useState } from 'react';
import { foldVietnamese, mentionQueryAt } from '@/domain/chat';
import './lucian-078.css';
import './lucian-268.css';

export interface MentionOption {
  id: string;
  name: string;
  detail: string;
}

interface Props {
  replyTo: { author: string; text: string } | null;
  onCancelReply: () => void;
  onSend: (text: string) => void;
  mentionables: MentionOption[];
  maxLength: number;
  placeholder: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');
}

function Highlighted({ name, query }: { name: string; query: string }) {
  const at = query ? foldVietnamese(name).indexOf(foldVietnamese(query)) : -1;
  if (at < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, at)}
      <b>{name.slice(at, at + query.length)}</b>
      {name.slice(at + query.length)}
    </>
  );
}

export function ChatComposer({ replyTo, onCancelReply, onSend, mentionables, maxLength, placeholder }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const [text, setText] = useState('');
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);

  const matches = mention ? mentionables.filter((m) => foldVietnamese(m.name).includes(foldVietnamese(mention.query))) : [];
  const notified = mentionables.filter((m) => text.includes(`@${m.name}`));
  const hasText = Boolean(text.trim());
  const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function syncMention(value: string, caret: number | null) {
    const next = caret === null ? null : mentionQueryAt(value, caret);
    setMention(next);
    if (next?.query !== mention?.query) setActive(0);
  }

  function insert(option: MentionOption) {
    if (!mention) return;
    const input = inputRef.current!;
    const caret = input.selectionStart ?? text.length;
    const token = `@${option.name} `;
    const next = text.slice(0, mention.start) + token + text.slice(caret);
    setText(next);
    setMention(null);
    const pos = mention.start + token.length;
    requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
      input.setSelectionRange(pos, pos);
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) {
      if (!rm) sendRef.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300 });
      return;
    }
    onSend(body);
    setText('');
    setMention(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (mention && matches.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActive((a) => (a + step + matches.length) % matches.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insert(matches[Math.min(active, matches.length - 1)]);
        return;
      }
    }
    if (e.key === 'Escape') {
      if (mention) setMention(null);
      else if (replyTo) {
        e.preventDefault();
        onCancelReply();
      }
    }
  }

  const open = Boolean(mention);
  const activeOption = open && matches.length ? `${listId}-${matches[Math.min(active, matches.length - 1)].id}` : undefined;

  return (
    <div className="u078-composer">
      <div className={`u078-reply${replyTo ? ' on' : ''}`}>
        <div>
          <div className="u078-rbox">
            <span>
              <b>Trả lời {replyTo?.author}</b>
              <em>{replyTo?.text}</em>
            </span>
            <button
              className="u078-rx"
              type="button"
              aria-label="Hủy trả lời"
              tabIndex={replyTo ? 0 : -1}
              onClick={() => {
                onCancelReply();
                inputRef.current?.focus();
              }}
            >
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 3l6 6M9 3L3 9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`u268${open ? ' is-pop' : ''}`}>
        <div className="u268-pp" role="listbox" id={listId} aria-label="Thành viên team">
          {matches.map((m, i) => (
            <button
              key={m.id}
              id={`${listId}-${m.id}`}
              type="button"
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              className={`u268-op${i === active ? ' is-on' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(m)}
            >
              <i aria-hidden="true">{initials(m.name)}</i>
              <span>
                <Highlighted name={m.name} query={mention?.query ?? ''} />
              </span>
              <small>{m.detail}</small>
            </button>
          ))}
          {open && matches.length === 0 && <div className="u268-no">Không có thành viên phù hợp</div>}
        </div>
        {notified.length > 0 && (
          <div className="u268-ft">
            <small>Sẽ báo cho</small>
            <span className="u268-av">
              {notified.map((m) => (
                <i key={m.id} title={m.name}>
                  {initials(m.name)}
                </i>
              ))}
            </span>
          </div>
        )}
      </div>

      <form className="u078-bar" onSubmit={submit}>
        <input
          ref={inputRef}
          className="u078-in"
          type="text"
          value={text}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label="Tin nhắn"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption}
          onChange={(e) => {
            setText(e.target.value);
            syncMention(e.target.value, e.target.selectionStart);
          }}
          onClick={(e) => syncMention(e.currentTarget.value, e.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          // Options keep focus on mousedown, so leaving the input really means leaving the list.
          onBlur={() => setMention(null)}
        />
        <button ref={sendRef} className={`u078-send${hasText ? ' go' : ''}`} type="submit" aria-label="Gửi">
          <svg className="s" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3.5 10L16.5 3.5 12 16.5 9.5 11z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
