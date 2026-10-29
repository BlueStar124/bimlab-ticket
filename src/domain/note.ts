// Link board rules: what a shared link is, how it is guessed, sorted and ranked. Pure functions, no React or storage.

export const NOTE_CATEGORIES = ['resource', 'repository', 'prompt', 'tool', 'design', 'video', 'general'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export const NOTE_BOARDS = ['frontend', 'backend', 'devops', 'ai', 'internal'] as const;
export type NoteBoard = (typeof NOTE_BOARDS)[number];

export interface SharedNote {
  id: string;
  title: string;
  category: NoteCategory;
  customType: string | null;
  board: NoteBoard;
  pinned: boolean;
  /** What the person who pinned it uses it for; for prompts, the prompt itself. */
  content: string;
  url: string | null;
  /** Page description fetched when the link was added. */
  description: string | null;
  tags: string[];
  authorId: string;
  /** Members who marked it useful, oldest first. */
  likedBy: string[];
  likesThisWeek: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveNoteInput {
  title: string;
  category: NoteCategory;
  customType: string | null;
  board: NoteBoard;
  content: string;
  url: string | null;
  description: string | null;
  tags: string[];
}

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  /** The note that already holds this link, if any. */
  duplicate: SharedNote | null;
}

export const NOTE_CATEGORY_LABEL: Record<NoteCategory, string> = {
  resource: 'Tài liệu',
  repository: 'Repo',
  prompt: 'AI & Prompt',
  tool: 'Công cụ',
  design: 'Thiết kế',
  video: 'Video',
  general: 'Khác',
};

export const NOTE_BOARD_LABEL: Record<NoteBoard, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  devops: 'DevOps',
  ai: 'AI',
  internal: 'Nội bộ',
};

export const HOT_LIMIT = 3;

/** Parses what someone pasted or typed into a link; bare domains such as "vite.dev/guide" get https://. */
export function parseLink(text: string): URL | null {
  let value = text.trim();
  if (!value || /\s/.test(value)) return null;
  if (!/^https?:\/\//i.test(value)) {
    if (!/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(value)) return null;
    value = `https://${value}`;
  }
  try {
    const url = new URL(value);
    return url.hostname.includes('.') ? url : null;
  } catch {
    return null;
  }
}

export function hostOf(url: string | URL): string {
  const parsed = typeof url === 'string' ? parseLink(url) : url;
  return parsed ? parsed.hostname.toLowerCase().replace(/^www\./, '') : '';
}

/** First guess of the kind of link from its address; the person can change it before pinning. */
export function guessCategory(url: URL): NoteCategory {
  const host = hostOf(url);
  const path = url.pathname.toLowerCase();
  if (/(^|\.)(github\.com|gitlab\.com|bitbucket\.org)$/.test(host) || host === 'dev.bimlab.com.vn') return 'repository';
  if (/(^|\.)(chatgpt\.com|claude\.ai|openai\.com|anthropic\.com|huggingface\.co|gemini\.google\.com)$/.test(host)) return 'prompt';
  if (/(^|\.)(figma\.com|dribbble\.com|behance\.net|heroicons\.com|fonts\.google\.com)$/.test(host)) return 'design';
  if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/.test(host)) return 'video';
  if (/^docs\./.test(host) || /\/(docs|kb|guide|wiki)(\/|$)/.test(path)) return 'resource';
  return 'tool';
}

/** Board suggested for a new link: AI links go to AI, BIMLab repos to Nội bộ, otherwise the board being viewed. */
export function guessBoard(category: NoteCategory, url: URL | null, viewing: NoteBoard | 'all'): NoteBoard {
  if (category === 'prompt') return 'ai';
  if (url && hostOf(url).endsWith('bimlab.com.vn')) return 'internal';
  if (category === 'design') return 'frontend';
  return viewing === 'all' ? 'backend' : viewing;
}

function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
}

/** Every word of the query appears somewhere in the note (accents and case ignored). */
export function matchesQuery(note: SharedNote, query: string, authorName: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = [note.title, note.content, note.description ?? '', note.url ?? '', hostOf(note.url ?? ''), note.customType ?? '',
    NOTE_CATEGORY_LABEL[note.category], NOTE_BOARD_LABEL[note.board], authorName, ...note.tags].join(' ');
  const haystack = fold(text);
  return words.every((w) => haystack.includes(w));
}

/** Shortens titles that repeat the description, e.g. GitHub's "GitHub - owner/repo: description" becomes "owner/repo". */
export function cleanPageTitle(title: string, url: URL): string {
  const github = hostOf(url) === 'github.com' ? /^GitHub - ([^\s:]+\/[^\s:]+)(?::.*)?$/.exec(title.trim()) : null;
  return github ? github[1] : title.trim();
}

/** Pinned links first, then newest first within each group. */
export function boardOrder(notes: SharedNote[]): { pinned: SharedNote[]; rest: SharedNote[] } {
  const newest = (a: SharedNote, b: SharedNote) => b.createdAt.localeCompare(a.createdAt);
  return {
    pinned: notes.filter((n) => n.pinned).sort(newest),
    rest: notes.filter((n) => !n.pinned).sort(newest),
  };
}

/** Links with the most likes given in the last 7 days; ties go to the newer link. */
export function hotNotes(notes: SharedNote[], limit = HOT_LIMIT): SharedNote[] {
  return notes
    .filter((n) => n.likesThisWeek > 0)
    .sort((a, b) => b.likesThisWeek - a.likesThisWeek || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** The note after a member toggles their like, before the server answers. */
export function withLikeToggled(note: SharedNote, personId: string): SharedNote {
  const liked = note.likedBy.includes(personId);
  return {
    ...note,
    likedBy: liked ? note.likedBy.filter((id) => id !== personId) : [...note.likedBy, personId],
    likesThisWeek: Math.max(0, note.likesThisWeek + (liked ? -1 : 1)),
  };
}
