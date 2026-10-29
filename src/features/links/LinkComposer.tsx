// What a pasted link becomes before it goes on the board: a live sticky-note preview next to a short form.
// The server fetches the page title/description and reports whether the link is already on the board.
import type { FormEvent } from 'react';
import { personById } from '@/data/people';
import { NOTE_BOARDS, NOTE_BOARD_LABEL, NOTE_CATEGORIES, NOTE_CATEGORY_LABEL, type NoteBoard, type NoteCategory, type SharedNote, hostOf } from '@/domain/note';
import { formatRelative } from '@/domain/ticket';
import { Icon } from '@/shared/ui/Icon';
import { LinkCard } from '@/features/links/LinkCard';

export interface Draft {
  url: string | null;
  title: string;
  description: string | null;
  category: NoteCategory;
  customType: string;
  board: NoteBoard;
  content: string;
}

interface Props {
  draft: Draft;
  meId: string;
  now: number;
  /** True while the server is fetching the page title. */
  checking: boolean;
  duplicate: SharedNote | null;
  saving: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onShowDuplicate: () => void;
  onLikeDuplicate: () => void;
}

export function LinkComposer({ draft, meId, now, checking, duplicate, saving, onChange, onSubmit, onCancel, onShowDuplicate, onLikeDuplicate }: Props) {
  const previewNote: SharedNote = {
    id: 'draft', title: draft.title || (draft.url ? hostOf(draft.url) : 'Ghi chú mới'), category: draft.category,
    customType: draft.customType || null, board: draft.board, pinned: false, content: draft.content, url: draft.url,
    description: draft.description, tags: [], authorId: meId, likedBy: [], likesThisWeek: 0,
    createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
  };
  const isPrompt = draft.category === 'prompt';
  const owner = duplicate ? personById(duplicate.authorId)?.name ?? duplicate.authorId : '';
  const canSave = !duplicate && !saving && draft.title.trim() && draft.content.trim() && (draft.category !== 'general' || draft.customType.trim());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (canSave) onSubmit();
  }

  return (
    <div className="link-composer">
      <div className="link-composer-preview" aria-hidden="true">
        <LinkCard note={previewNote} meId={meId} now={now} preview />
      </div>
      <form className="link-composer-form" onSubmit={submit} noValidate>
        {duplicate && (
          <div className="link-dup" role="alert">
            <Icon name="alert" size={18} />
            <div>
              <b>{owner}</b> đã ghim link này {formatRelative(duplicate.createdAt, now).toLocaleLowerCase('vi')} trên bảng {NOTE_BOARD_LABEL[duplicate.board]}.
              <div className="link-dup-actions">
                <button type="button" className="btn btn-sm" onClick={onShowDuplicate}>Xem tờ đó</button>
                {!duplicate.likedBy.includes(meId) && (
                  <button type="button" className="btn btn-sm" onClick={onLikeDuplicate}>
                    <Icon name="heart" size={15} /> Thả tim cho tờ đó
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="field">
          <label htmlFor="link-title">Tiêu đề {checking && <span className="link-checking">· đang lấy từ trang…</span>}</label>
          <input id="link-title" className="input" maxLength={200} value={draft.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="link-category">Loại</label>
            <select id="link-category" className="select" value={draft.category} onChange={(e) => onChange({ category: e.target.value as NoteCategory })}>
              {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{NOTE_CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="link-board">Bảng</label>
            <select id="link-board" className="select" value={draft.board} onChange={(e) => onChange({ board: e.target.value as NoteBoard })}>
              {NOTE_BOARDS.map((b) => <option key={b} value={b}>{NOTE_BOARD_LABEL[b]}</option>)}
            </select>
          </div>
        </div>
        {draft.category === 'general' && (
          <div className="field">
            <label htmlFor="link-custom-type">Tên loại</label>
            <input id="link-custom-type" className="input" maxLength={60} value={draft.customType} placeholder="Ví dụ: Quy trình, Mẹo…"
              onChange={(e) => onChange({ customType: e.target.value })} />
          </div>
        )}
        <div className="field">
          <label htmlFor="link-content">{isPrompt ? 'Nội dung prompt' : 'Dùng để làm gì?'}</label>
          <textarea id="link-content" className={`textarea ${isPrompt ? '' : 'link-hand-input'}`} maxLength={isPrompt ? 20000 : 300} autoFocus
            value={draft.content} onChange={(e) => onChange({ content: e.target.value })}
            placeholder={isPrompt ? 'Dán prompt để cả team chép dùng lại' : 'Một câu thôi, ví dụ: cấu hình proxy /api lúc dev'} />
        </div>
        {draft.url && <p className="link-hint">Loại và bảng được đoán từ {hostOf(draft.url)}, đổi được nếu đoán sai.</p>}
        <div className="link-composer-actions">
          <button className="btn btn-primary" type="submit" disabled={!canSave}>
            <Icon name="bookmark" size={17} /> {saving ? 'Đang ghim…' : 'Ghim lên bảng'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onCancel}>Hủy</button>
        </div>
      </form>
    </div>
  );
}
