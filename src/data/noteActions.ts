// Link board writes. Likes and pins change on screen at once and are replaced by the server's copy when it answers.
import { createSharedNote, setNoteLiked, setNotePinned } from '@/data/noteApi';
import { getState, setState } from '@/data/store';
import { type SaveNoteInput, type SharedNote, withLikeToggled } from '@/domain/note';

function replace(note: SharedNote) {
  const s = getState();
  const known = s.notes.some((n) => n.id === note.id);
  setState({ ...s, notes: known ? s.notes.map((n) => (n.id === note.id ? note : n)) : [note, ...s.notes] });
}

function findNote(id: string): SharedNote {
  const note = getState().notes.find((n) => n.id === id);
  if (!note) throw new Error('Không tìm thấy link này');
  return note;
}

/** Applies the optimistic copy now; settles on the server's copy, or puts the old one back if the write fails. */
function optimistic(before: SharedNote, after: SharedNote, write: Promise<SharedNote>) {
  replace(after);
  void write.then(replace, () => replace(before));
}

export function toggleLike(id: string, personId: string) {
  const before = findNote(id);
  optimistic(before, withLikeToggled(before, personId), setNoteLiked(id, !before.likedBy.includes(personId)));
}

export function togglePin(id: string) {
  const before = findNote(id);
  optimistic(before, { ...before, pinned: !before.pinned }, setNotePinned(id, !before.pinned));
}

export async function addNote(input: SaveNoteInput): Promise<SharedNote> {
  const created = await createSharedNote(input);
  replace(created);
  return created;
}
