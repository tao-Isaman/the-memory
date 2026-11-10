import type { MemoryStory, MemoryTheme, StoryType } from '../types/memory';

/**
 * Starter templates for the create flow (/create?template=<slug>).
 *
 * A template is an ordered list of steps. A step is either a story we can pre-fill
 * completely (PIN, text) or a *slot*: a story that needs something only the user has
 * (a photo, a YouTube link). Slots are never turned into stories up front, so a memory
 * started from a template can never be saved with an image-less or link-less story.
 *
 * Pure module: no i18n, no browser APIs. Copy is passed in by the caller.
 */
type TemplateStep =
  | { kind: 'password'; key: string; password: string }
  | { kind: 'text'; key: string }
  | { kind: 'slot'; key: string; type: StoryType };

export interface MemoryTemplate {
  slug: string;
  theme: MemoryTheme;
  steps: TemplateStep[];
}

/** Localised text for one template, read from messages `create.templates.<slug>`. */
export interface TemplateCopy {
  title: string;
  stories: Record<string, { title?: string; text?: string }>;
}

/** One entry per template step, in template order. `storyId` is null for an unfilled slot. */
export interface SequenceEntry {
  key: string;
  storyId: string | null;
  /** Set for slots only: the story type the slot asks for. */
  slotType?: StoryType;
}

export interface TemplateDraft {
  title: string;
  theme: MemoryTheme;
  stories: MemoryStory[];
  sequence: SequenceEntry[];
}

const MEMORY_TEMPLATES: MemoryTemplate[] = [
  {
    slug: 'loykrathong',
    theme: 'love',
    steps: [
      // Loy Krathong 2569 falls on 24 Nov: 24/11/69. Shown to the creator, editable.
      { kind: 'password', key: 'pin', password: '241169' },
      { kind: 'text', key: 'wish' },
      { kind: 'slot', key: 'photo', type: 'image' },
      { kind: 'slot', key: 'song', type: 'youtube' },
      { kind: 'text', key: 'closing' },
    ],
  },
];

export function getMemoryTemplate(slug: string | null | undefined): MemoryTemplate | undefined {
  return MEMORY_TEMPLATES.find((t) => t.slug === slug);
}

function renumber(stories: MemoryStory[]): MemoryStory[] {
  return stories.map((s, i) => ({ ...s, priority: i }));
}

export function buildTemplateDraft(
  template: MemoryTemplate,
  copy: TemplateCopy,
  makeId: () => string,
  now: string,
): TemplateDraft {
  const stories: MemoryStory[] = [];
  const sequence: SequenceEntry[] = [];
  for (const step of template.steps) {
    if (step.kind === 'slot') {
      sequence.push({ key: step.key, storyId: null, slotType: step.type });
      continue;
    }
    const base = { id: makeId(), priority: 0, createdAt: now, title: copy.stories[step.key]?.title };
    stories.push(
      step.kind === 'password'
        ? { ...base, type: 'password', content: { password: step.password } }
        : { ...base, type: 'text', content: { text: copy.stories[step.key]?.text ?? '' } },
    );
    sequence.push({ key: step.key, storyId: base.id });
  }
  return { title: copy.title, theme: template.theme, stories: renumber(stories), sequence };
}

/** Slots with no story in the current list (never filled, or filled and then deleted). */
export function openSlots(
  sequence: SequenceEntry[],
  stories: MemoryStory[],
): Array<{ key: string; type: StoryType }> {
  const present = new Set(stories.map((s) => s.id));
  return sequence.flatMap((e) =>
    e.slotType && !(e.storyId && present.has(e.storyId)) ? [{ key: e.key, type: e.slotType }] : [],
  );
}

/**
 * Put a newly written story where its slot sits in the template: before the first later
 * step that still has a story in the list, or at the end if none is left.
 */
export function fillTemplateSlot(
  stories: MemoryStory[],
  sequence: SequenceEntry[],
  slotKey: string,
  story: MemoryStory,
): { stories: MemoryStory[]; sequence: SequenceEntry[] } {
  const at = sequence.findIndex((e) => e.key === slotKey);
  const laterIds = at < 0 ? [] : sequence.slice(at + 1).map((e) => e.storyId);
  const anchor = stories.findIndex((s) => laterIds.includes(s.id));
  const index = anchor < 0 ? stories.length : anchor;
  return {
    stories: renumber([...stories.slice(0, index), story, ...stories.slice(index)]),
    sequence: sequence.map((e) => (e.key === slotKey ? { ...e, storyId: story.id } : e)),
  };
}
