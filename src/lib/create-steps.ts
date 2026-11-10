/**
 * Rules of the create-memory page that do not depend on React: which tabs exist, what is
 * still missing before a memory can be saved, and where the user should go next.
 * Both layouts (classic and tabs) read "what is missing" from here.
 */
export const CREATE_TABS = ['settings', 'stories', 'review'] as const;
export type CreateTab = (typeof CREATE_TABS)[number];

/** `slot:<key>` is a required step of a starter template (e.g. the couple's own PIN). */
/** `content`: there are stories, but only PIN pages; nothing for the recipient to see. */
export type MissingItem = 'title' | 'stories' | 'content' | `slot:${string}`;

export interface CreateDraftState {
  title: string;
  storyCount: number;
  /** Stories other than PIN pages. */
  contentStoryCount: number;
  /**
   * New memories need at least one content story. Off when editing a memory that was
   * saved before this rule, so an existing PIN-only memory can still be opened and saved.
   */
  requireContent: boolean;
  /** Keys of required template slots that have no story yet. */
  requiredSlotKeys: string[];
}

/** Everything that blocks saving, in the order the page checks it. Empty = can save. */
export function missingItems(d: CreateDraftState): MissingItem[] {
  return [
    ...(d.title.trim() ? [] : (['title'] as const)),
    ...(d.storyCount > 0 ? [] : (['stories'] as const)),
    ...(d.requireContent && d.storyCount > 0 && d.contentStoryCount === 0 ? (['content'] as const) : []),
    ...d.requiredSlotKeys.map((key) => `slot:${key}` as const),
  ];
}

/** The tab where a missing item is fixed. */
export function tabForMissing(item: MissingItem): CreateTab {
  return item === 'title' ? 'settings' : 'stories';
}

/** Tab after `tab`, or null on the last one (where the bottom bar saves instead). */
export function nextTab(tab: CreateTab): CreateTab | null {
  return CREATE_TABS[CREATE_TABS.indexOf(tab) + 1] ?? null;
}

/**
 * Which layout to render. `?layout=tabs` / `?layout=classic` always win; otherwise the
 * default (tabs since a full signed-in run passed on 2026-11-10; classic stays reachable
 * with `?layout=classic` as a fallback). Unknown values fall back to the default, so a bad link never breaks the page.
 */
export type CreateLayout = 'classic' | 'tabs';
export const DEFAULT_CREATE_LAYOUT: CreateLayout = 'tabs';

export function resolveLayout(param: string | null | undefined): CreateLayout {
  return param === 'tabs' || param === 'classic' ? param : DEFAULT_CREATE_LAYOUT;
}
