// One sticky note on the link board: kind and board, title link, domain, page description, what it is used for
// (or the prompt with a copy button), who pinned it, and the like / pin toggles.
import type { CSSProperties } from 'react';
import { personById } from '@/data/people';
import { shortName } from '@/domain/people';
import { NOTE_BOARD_LABEL, NOTE_CATEGORY_LABEL, type SharedNote, hostOf } from '@/domain/note';
import { formatRelative } from '@/domain/ticket';
import { toast } from '@/shared/lucian/Toaster';
import { Icon } from '@/shared/ui/Icon';

/** Small stable tilt per note so the board looks hand-pinned but does not reshuffle on every render. */
function tiltOf(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return `${((hash % 7) - 3) * 0.45}deg`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ kind: 'ok', title: 'Đã chép prompt' });
  } catch {
    toast({ kind: 'err', title: 'Trình duyệt chặn chép tự động', detail: 'Bôi đen nội dung rồi nhấn Ctrl+C' });
  }
}

interface Props {
  note: SharedNote;
  meId: string;
  now: number;
  /** Preview inside the composer: no actions. */
  preview?: boolean;
  onLike?: () => void;
  onPin?: () => void;
}

export function LinkCard({ note, meId, now, preview, onLike, onPin }: Props) {
  const host = note.url ? hostOf(note.url) : '';
  const author = personById(note.authorId);
  const liked = note.likedBy.includes(meId);
  const kind = note.category === 'general' && note.customType ? note.customType : NOTE_CATEGORY_LABEL[note.category];

  return (
    <article
      className={`link-note t-${note.category}${note.pinned ? ' is-pinned' : ''}`}
      data-note-id={preview ? undefined : note.id}
      style={{ '--tilt': preview ? '-1.2deg' : tiltOf(note.id) } as CSSProperties}
    >
      <header className="link-note-top">
        <span className="link-note-kind">{kind}</span>
        <span aria-hidden="true">·</span>
        <span>{NOTE_BOARD_LABEL[note.board]}</span>
        {!preview && (
          <button type="button" className="link-note-icon" onClick={onPin} aria-pressed={note.pinned}
            aria-label={note.pinned ? 'Bỏ ghim' : 'Ghim lên đầu bảng'} title={note.pinned ? 'Bỏ ghim' : 'Ghim lên đầu bảng'}>
            <Icon name={note.pinned ? 'bookmarkFilled' : 'bookmark'} size={17} />
          </button>
        )}
      </header>

      {note.url ? (
        <a className="link-note-title" href={note.url} target="_blank" rel="noopener noreferrer">{note.title}</a>
      ) : (
        <p className="link-note-title">{note.title}</p>
      )}
      {host && (
        <p className="link-note-domain">
          <b aria-hidden="true">{host.charAt(0).toUpperCase()}</b>
          <span>{host}</span>
        </p>
      )}
      {note.description && <p className="link-note-desc">{note.description}</p>}

      {note.category === 'prompt' ? (
        <div className="link-note-prompt">
          <pre>{note.content}</pre>
          {!preview && (
            <button type="button" className="btn btn-sm" onClick={() => void copyText(note.content)}>
              <Icon name="copy" size={15} /> Chép prompt
            </button>
          )}
        </div>
      ) : (
        note.content && <p className="link-note-hand">{note.content}</p>
      )}

      {note.tags.length > 0 && (
        <p className="link-note-tags">{note.tags.map((t) => <span key={t}>#{t}</span>)}</p>
      )}

      <footer className="link-note-foot">
        <span className="link-note-who">
          {author ? shortName(author) : note.authorId} · {formatRelative(note.createdAt, now)}
        </span>
        {!preview && (
          <button type="button" className="link-like" onClick={onLike} aria-pressed={liked}
            aria-label={`Hữu ích, ${note.likedBy.length} người thả tim`} title={liked ? 'Bỏ tim' : 'Thả tim: link này hữu ích'}>
            <Icon name={liked ? 'heartFilled' : 'heart'} size={15} />
            {note.likedBy.length}
          </button>
        )}
      </footer>
    </article>
  );
}
