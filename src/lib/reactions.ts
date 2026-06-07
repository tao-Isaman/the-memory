// Reaction / reply loop — anonymous recipient client helpers (engagement — Phase 3).
// Best-effort; mirrors the view-tracking pattern (anonymous viewer id + service-role API).
import { getViewerId } from './view-tracking';

/** Allowed reaction emojis — shared by the ending-screen UI and the API validation. */
export const REACTION_EMOJIS = ['❤️', '😍', '🥹', '🔥', '🙏'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Max length of an optional reply (kept in sync with the API). */
export const REACTION_MESSAGE_MAX = 280;

const ENDPOINT = '/api/memory/reaction';

export interface SendReactionInput {
  emoji?: string;
  message?: string;
  isOwner?: boolean;
}

/** Send a reaction (and/or short reply) to a memory's owner. Never throws. */
export async function sendReaction(
  memoryId: string,
  { emoji = '❤️', message, isOwner = false }: SendReactionInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryId, viewerId: getViewerId(), emoji, message, isOwner }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.error || 'ส่งไม่สำเร็จ' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' };
  }
}
