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

/**
 * Failure reason, as a stable code — this is a plain lib (no next-intl here), so the UI
 * maps the code to a localized string instead of the lib returning user-facing copy.
 */
export type SendReactionError = 'send_failed' | 'network_error';

/** Send a reaction (and/or short reply) to a memory's owner. Never throws. */
export async function sendReaction(
  memoryId: string,
  { emoji = '❤️', message, isOwner = false }: SendReactionInput,
): Promise<{ ok: boolean; error?: SendReactionError }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoryId, viewerId: getViewerId(), emoji, message, isOwner }),
    });
    if (!res.ok) return { ok: false, error: 'send_failed' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}
