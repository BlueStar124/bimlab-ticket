// Link board: the team's useful links as sticky notes. Paste a link anywhere on the page to pin it; like links that
// helped so they rise to "Hot tuần này"; pin the ones everybody needs.
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { addNote, toggleLike, togglePin } from '@/data/noteActions';
import { previewLink } from '@/data/noteApi';
import { personById } from '@/data/people';
import { useCurrentUser } from '@/data/session';
import { useStore } from '@/data/store';
import {
  NOTE_BOARDS, NOTE_BOARD_LABEL, NOTE_CATEGORIES, NOTE_CATEGORY_LABEL, type NoteBoard, type SharedNote,
  boardOrder, cleanPageTitle, guessBoard, guessCategory, hostOf, hotNotes, matchesQuery, parseLink,
} from '@/domain/note';
import { useNow } from '@/shared/hooks/useNow';
import { toast } from '@/shared/lucian/Toaster';
import { Icon } from '@/shared/ui/Icon';
import { type Draft, LinkComposer } from '@/features/links/LinkComposer';
import { LinkCard } from '@/features/links/LinkCard';
import './links.css';

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);

export function LinksPage() {
  const me = useCurrentUser();
  const now = useNow(60_000);
  const notes = useStore((s) => s.notes);
  const [board, setBoard] = useState<NoteBoard | 'all'>('all');
  const [query, setQuery] = useState('');
  const [linkText, setLinkText] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [checking, setChecking] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  // The link the latest preview request is for, so a slow answer for an older paste is ignored.
  const previewFor = useRef<string | null>(null);

  const duplicate = duplicateId ? notes.find((n) => n.id === duplicateId) ?? null : null;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: notes.length };
    for (const n of notes) c[n.board] = (c[n.board] ?? 0) + 1;
    return c;
  }, [notes]);
  const hot = useMemo(() => hotNotes(notes), [notes]);
  const { pinned, rest } = useMemo(() => boardOrder(notes.filter((n) => (board === 'all' || n.board === board)
    && matchesQuery(n, query, personById(n.authorId)?.name ?? ''))), [notes, board, query]);

  function startCapture(text: string) {
    const url = parseLink(text);
    if (!url) {
      toast({ kind: 'err', title: 'Đây chưa phải một link', detail: 'Dán địa chỉ dạng https://… hoặc tên miền như vite.dev/guide' });
      return;
    }
    const category = guessCategory(url);
    setDraft({ url: url.href, title: hostOf(url), description: null, category, customType: '', board: guessBoard(category, url, board), content: '' });
    setDuplicateId(null);
    setLinkText('');
    setChecking(true);
    previewFor.current = url.href;
    previewLink(url.href)
      .then((preview) => {
        if (previewFor.current !== url.href) return;
        setDraft((d) => d && d.url === url.href ? { ...d, description: preview.description, title: d.title === hostOf(url) && preview.title ? cleanPageTitle(preview.title, url) : d.title } : d);
        setDuplicateId(preview.duplicate?.id ?? null);
      })
      .catch(() => undefined)
      .finally(() => { if (previewFor.current === url.href) setChecking(false); });
    requestAnimationFrame(() => composerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  function startWithoutLink() {
    previewFor.current = null;
    setDraft({ url: null, title: '', description: null, category: 'prompt', customType: '', board: 'ai', content: '' });
    setDuplicateId(null);
    setChecking(false);
  }

  // Paste a link anywhere on the page (outside form fields) to start pinning it.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping(e.target)) return;
      const text = e.clipboardData?.getData('text') ?? '';
      if (parseLink(text)) {
        e.preventDefault();
        startCapture(text);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  useEffect(() => {
    if (!flashId) return;
    const el = document.querySelector(`[data-note-id="${flashId}"]`);
    el?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const id = window.setTimeout(() => setFlashId(null), 2600);
    return () => window.clearTimeout(id);
  }, [flashId]);

  function showNote(id: string) {
    setBoard('all');
    setQuery('');
    setFlashId(id);
  }

  function closeComposer() {
    previewFor.current = null;
    setDraft(null);
    setDuplicateId(null);
    setChecking(false);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const created = await addNote({
        title: draft.title.trim(), category: draft.category, customType: draft.category === 'general' ? draft.customType.trim() : null,
        board: draft.board, content: draft.content.trim(), url: draft.url, description: draft.description, tags: [],
      });
      closeComposer();
      toast({ kind: 'ok', title: `Đã ghim lên bảng ${NOTE_BOARD_LABEL[created.board]}` });
      showNote(created.id);
    } catch {
      // The API error toast says why (for example the link was pinned meanwhile).
    } finally {
      setSaving(false);
    }
  }

  function submitLink(e: FormEvent) {
    e.preventDefault();
    startCapture(linkText);
  }

  const card = (n: SharedNote) => (
    <div key={n.id} className={`link-slot${flashId === n.id ? ' is-flash' : ''}`}>
      <LinkCard note={n} meId={me.id} now={now} onLike={() => toggleLike(n.id, me.id)} onPin={() => togglePin(n.id)} />
    </div>
  );

  return (
    <main className="page links-page">
      <div className="page-head">
        <div>
          <h1>Bảng link</h1>
          <p>Link hay cả team đã thử. Dán link, ghi một câu nó dùng để làm gì, ghim lên bảng. Thả tim cho link giúp được bạn để người khác thấy trước.</p>
        </div>
      </div>

      <section className="link-capture" aria-label="Thêm link" ref={composerRef}>
        <form className="link-capture-row" onSubmit={submitLink} autoComplete="off">
          <label htmlFor="link-input" className="link-capture-input">
            <Icon name="link" size={18} />
            <input id="link-input" className="input" inputMode="url" value={linkText} onChange={(e) => setLinkText(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                if (parseLink(text)) {
                  e.preventDefault();
                  startCapture(text);
                }
              }}
              placeholder="Dán link vào đây, hoặc nhấn Ctrl+V ở bất kỳ đâu trên trang" aria-label="Link cần ghim" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={!linkText.trim()}>Thêm lên bảng</button>
        </form>
        {!draft && (
          <p className="link-capture-alt">
            Không có link? <button type="button" onClick={startWithoutLink}>Ghim một prompt hoặc ghi chú</button>
          </p>
        )}
        {draft && (
          <LinkComposer draft={draft} meId={me.id} now={now} checking={checking} duplicate={duplicate} saving={saving}
            onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
            onSubmit={() => void save()}
            onCancel={closeComposer}
            onShowDuplicate={() => duplicate && showNote(duplicate.id)}
            onLikeDuplicate={() => {
              if (!duplicate) return;
              if (!duplicate.likedBy.includes(me.id)) toggleLike(duplicate.id, me.id);
              closeComposer();
              showNote(duplicate.id);
              toast({ kind: 'ok', title: 'Đã thả tim cho tờ có sẵn', detail: 'Không tạo tờ trùng' });
            }}
          />
        )}
      </section>

      {hot.length > 0 && (
        <section className="link-hot" aria-labelledby="link-hot-title">
          <h2 id="link-hot-title">Hot tuần này <small>nhiều tim nhất trong 7 ngày</small></h2>
          <ol>
            {hot.map((n, i) => (
              <li key={n.id}>
                <span className="link-hot-rank">{i + 1}</span>
                <span className="link-hot-text">
                  {n.url ? <a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a> : <button type="button" onClick={() => showNote(n.id)}>{n.title}</button>}
                  <small>{n.url ? `${hostOf(n.url)} · ` : ''}{personById(n.authorId)?.name ?? n.authorId}</small>
                </span>
                <span className="link-hot-likes"><Icon name="heartFilled" size={15} />{n.likesThisWeek}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="link-board-section" aria-label="Bảng giấy nhớ">
        <div className="link-toolbar">
          <div className="chips" role="group" aria-label="Chọn bảng">
            {(['all', ...NOTE_BOARDS] as const).map((b) => (
              <button key={b} type="button" className="chip" aria-pressed={board === b} onClick={() => setBoard(b)}>
                {b === 'all' ? 'Tất cả' : NOTE_BOARD_LABEL[b]} <b>{counts[b] ?? 0}</b>
              </button>
            ))}
          </div>
          <label className="search link-search" htmlFor="link-search">
            <Icon name="search" size={17} />
            <input id="link-search" className="input" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tiêu đề, ghi chú, domain, người ghim…" aria-label="Tìm link" />
          </label>
        </div>
        <div className="link-legend" aria-hidden="true">
          {NOTE_CATEGORIES.map((c) => <span key={c}><i className={`t-${c}`} />{NOTE_CATEGORY_LABEL[c]}</span>)}
        </div>

        <div className="link-board">
          {pinned.length > 0 && (
            <>
              <p className="link-group">Đã ghim</p>
              <div className="link-notes">{pinned.map(card)}</div>
            </>
          )}
          {rest.length > 0 && (
            <>
              {pinned.length > 0 && <p className="link-group">Mới ghim gần đây</p>}
              <div className="link-notes">{rest.map(card)}</div>
            </>
          )}
          {pinned.length + rest.length === 0 && (
            <p className="empty">
              {query ? `Không có link nào khớp “${query}”.` : notes.length ? 'Bảng này chưa có link nào.' : 'Chưa có link nào. Dán link đầu tiên ở ô phía trên.'}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
