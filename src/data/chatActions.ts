// Team channel writes: send a message, remember how far each person has read.
import { getState, newId, setState } from '@/data/store';
import type { ChatMessage } from '@/domain/chat';
import { MAX_MESSAGE_LENGTH } from '@/domain/chat';
import { isMember } from '@/domain/people';

export function sendMessage(text: string, authorId: string, replyToId: string | null): ChatMessage {
  if (!isMember(authorId)) throw new Error('Chỉ thành viên team IT mới nhắn được trong kênh');
  const body = text.trim();
  if (!body) throw new Error('Tin nhắn trống');
  if (body.length > MAX_MESSAGE_LENGTH) throw new Error(`Tin nhắn dài quá ${MAX_MESSAGE_LENGTH} ký tự`);
  const s = getState();
  if (replyToId && !s.messages.some((m) => m.id === replyToId)) throw new Error('Không tìm thấy tin nhắn đang trả lời');
  const message: ChatMessage = { id: newId('m'), authorId, text: body, at: new Date().toISOString(), replyToId };
  setState({ ...s, messages: [...s.messages, message], chatReadAt: { ...s.chatReadAt, [authorId]: message.at } });
  return message;
}

/** Moves the person's read marker forward; never backwards, and no write when nothing changes. */
export function markChatRead(personId: string, at: string) {
  const s = getState();
  const current = s.chatReadAt[personId];
  if (current && current >= at) return;
  setState({ ...s, chatReadAt: { ...s.chatReadAt, [personId]: at } });
}
