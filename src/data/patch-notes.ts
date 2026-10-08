export type PatchItemType = 'feature' | 'improvement' | 'fix' | 'announcement';

export interface PatchItem {
  /** Badge type. The item's TEXT lives in messages/<locale>/updates.json (see below). */
  type: PatchItemType;
}

export interface PatchNote {
  /** Version string, e.g. "1.3.0" — used as localStorage key and message key */
  version: string;
  /** ISO date string, e.g. "2026-02-09" — formatted per locale at render time */
  date: string;
  /** Badge types, in display order. Index i maps to notes.<key>.items[i] in updates.json. */
  items: PatchItem[];
}

/**
 * next-intl resolves message keys by splitting on ".", so a raw version like
 * "2.9.0" cannot be used as a key. Store/read them as "v2_9_0" instead.
 */
export function versionKey(version: string): string {
  return `v${version.replace(/\./g, '_')}`;
}

/**
 * Patch notes — NEWEST FIRST
 *
 * Only locale-independent data lives here (version, date, badge types).
 * The title, summary and item texts live in messages/{th,en,id}/updates.json under
 * `notes.<versionKey>` — e.g. version "3.0.0" → key "v3_0_0":
 *
 *   "v3_0_0": {
 *     "title": "<release title>",
 *     "summary": "<short summary>",
 *     "items": ["<item 1 text>", "<item 2 text>"]
 *   }
 *
 * To add a new update: paste the entry below at the TOP of this array AND add the
 * matching `notes.<versionKey>` block to ALL THREE locale files. `items` must have
 * the same length in both places, and `summary` is required.
 *
 * {
 *   version: "X.Y.Z",
 *   date: "YYYY-MM-DD",
 *   items: [
 *     { type: "feature" },
 *     { type: "improvement" },
 *     { type: "fix" },
 *     { type: "announcement" },
 *   ],
 * },
 */
export const patchNotes: PatchNote[] = [
  {
    version: '3.2.0',
    date: '2026-10-08',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'announcement' },
    ],
  },
  {
    version: '3.1.0',
    date: '2026-10-08',
    items: [
      { type: 'announcement' },
      { type: 'feature' },
      { type: 'improvement' },
    ],
  },
  {
    version: '3.0.0',
    date: '2026-07-12',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
      { type: 'improvement' },
    ],
  },
  {
    version: '2.9.0',
    date: '2026-07-04',
    items: [
      { type: 'improvement' },
      { type: 'improvement' },
      { type: 'fix' },
    ],
  },
  {
    version: '2.8.1',
    date: '2026-06-12',
    items: [
      { type: 'improvement' },
      { type: 'announcement' },
    ],
  },
  {
    version: '2.8.0',
    date: '2026-06-10',
    items: [
      { type: 'feature' },
      { type: 'improvement' },
      { type: 'announcement' },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-06-10',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-06-08',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-06-03',
    items: [
      { type: 'feature' },
      { type: 'feature' },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-05-24',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'fix' },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-05-22',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-04-22',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
    ],
  },
  {
    version: '2.1.1',
    date: '2026-04-22',
    items: [
      { type: 'improvement' },
      { type: 'improvement' },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-09',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-02-16',
    items: [
      { type: 'announcement' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
      { type: 'improvement' },
      { type: 'improvement' },
      { type: 'improvement' },
      { type: 'improvement' },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-14',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
      { type: 'improvement' },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-02-13',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-13',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-09',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
      { type: 'improvement' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-09',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'fix' },
      { type: 'fix' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-02-05',
    items: [
      { type: 'feature' },
      { type: 'feature' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-02-03',
    items: [
      { type: 'feature' },
      { type: 'feature' },
      { type: 'improvement' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-01',
    items: [
      { type: 'announcement' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
      { type: 'feature' },
    ],
  },
];

export function getLatestVersion(): string {
  return patchNotes[0]?.version ?? '0.0.0';
}

export function getLatestPatchNote(): PatchNote | null {
  return patchNotes[0] ?? null;
}
