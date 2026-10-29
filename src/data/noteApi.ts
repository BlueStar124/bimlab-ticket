import { apiRequest } from '@/data/apiClient';
import type { LinkPreview, SaveNoteInput, SharedNote } from '@/domain/note';

export function listSharedNotes(options?: { quiet?: boolean }): Promise<SharedNote[]> {
  return apiRequest('/api/notes', undefined, options);
}

export function createSharedNote(input: SaveNoteInput): Promise<SharedNote> {
  return apiRequest('/api/notes', { method: 'POST', body: JSON.stringify(input) });
}

export function updateSharedNote(id: string, input: SaveNoteInput): Promise<SharedNote> {
  return apiRequest(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function deleteSharedNote(id: string): Promise<void> {
  return apiRequest(`/api/notes/${id}`, { method: 'DELETE' });
}

/** Page title/description fetched by the server, and the note already holding this link. Failures stay quiet. */
export function previewLink(url: string): Promise<LinkPreview> {
  return apiRequest('/api/notes/preview', { method: 'POST', body: JSON.stringify({ url }) }, { quiet: true });
}

export function setNotePinned(id: string, pinned: boolean): Promise<SharedNote> {
  return apiRequest(`/api/notes/${id}/pin`, { method: 'PATCH', body: JSON.stringify({ pinned }) });
}

export function setNoteLiked(id: string, liked: boolean): Promise<SharedNote> {
  return apiRequest(`/api/notes/${id}/like`, { method: liked ? 'PUT' : 'DELETE' });
}
