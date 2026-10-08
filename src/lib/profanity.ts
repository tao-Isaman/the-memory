// Tiny Thai/English profanity masker for user-visible free text (chat, wishes, names).
// Not a real moderation system — it just takes the sting out of the obvious words.
// Matching is substring-based because Thai has no word boundaries.

const WORDS = [
  // Thai
  'เหี้ย', 'เฮี้ย', 'สัส', 'สัตว์', 'ควย', 'คว ย', 'หี', 'เย็ด', 'ดอกทอง', 'ระยำ', 'ส้นตีน', 'อีดอก', 'ไอ้เลว', 'ชิบหาย', 'กะหรี่',
  // English
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 'slut', 'whore', 'nigger', 'faggot',
];

const PATTERN = new RegExp(WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');

/** Replace each profane substring with asterisks of the same length. */
export function maskProfanity(text: string): string {
  return text.replace(PATTERN, (m) => '*'.repeat(m.length));
}

export function hasProfanity(text: string): boolean {
  PATTERN.lastIndex = 0;
  return PATTERN.test(text);
}

/** Collapse whitespace, strip control chars, clamp length. */
export function cleanText(text: string, max: number): string {
  return text
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
