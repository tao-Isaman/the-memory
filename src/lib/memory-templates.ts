import type { MemoryStory, MemoryTheme, StoryType } from '../types/memory';

/**
 * Starter templates for the create flow (/create?template=<slug>).
 *
 * A template is an ordered list of steps. A step is either a story we can pre-fill
 * completely (text) or a *slot*: a story that needs something only the user has
 * (their own PIN, a photo, a YouTube link). The PIN is never pre-filled: a default code
 * shared by every template memory would be public. A `required` slot blocks saving.
 *
 * A slot is filled when the list holds a story of one of its types, however that story
 * got there (slot button, plain "add story", type switched in the editor). The story's
 * own type is the only source of truth; nothing tracks which button was pressed. Slots are never turned into stories up front, so a memory
 * started from a template can never be saved with an image-less or link-less story.
 *
 * Pure module: no i18n, no browser APIs. Copy is passed in by the caller.
 */
type TemplateStep =
  | { kind: 'text'; key: string }
  | {
      kind: 'slot';
      key: string;
      /** Story types that fill this slot; the first is what the slot button opens. */
      types: [StoryType, ...StoryType[]];
      required?: boolean;
    };

export interface MemoryTemplate {
  slug: string;
  theme: MemoryTheme;
  steps: TemplateStep[];
}

/** Localised text for one template, read from messages `create.templates.<slug>`. */
export interface TemplateCopy {
  title: string;
  stories: Record<string, { text?: string }>;
}

/** One entry per template step, in template order. Fixed once the draft is built. */
export type SequenceEntry =
  | { key: string; storyId: string }
  | { key: string; slotTypes: StoryType[]; required: boolean };

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
      { kind: 'slot', key: 'pin', types: ['password'], required: true },
      { kind: 'text', key: 'wish' },
      { kind: 'slot', key: 'photo', types: ['image', 'slideshow'] },
      { kind: 'slot', key: 'song', types: ['youtube'] },
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
      sequence.push({ key: step.key, slotTypes: step.types, required: !!step.required });
      continue;
    }
    const id = makeId();
    stories.push({ id, priority: 0, createdAt: now, type: 'text', content: { text: copy.stories[step.key]?.text ?? '' } });
    sequence.push({ key: step.key, storyId: id });
  }
  return { title: copy.title, theme: template.theme, stories: renumber(stories), sequence };
}

/** Index in `stories` of the story standing at this template step, or -1. */
function indexOfStep(entry: SequenceEntry, stories: MemoryStory[]): number {
  return 'storyId' in entry
    ? stories.findIndex((s) => s.id === entry.storyId)
    : stories.findIndex((s) => entry.slotTypes.includes(s.type));
}

/** Slots with no story of their type in the current list. */
export function openSlots(
  sequence: SequenceEntry[],
  stories: MemoryStory[],
): Array<{ key: string; type: StoryType; required: boolean }> {
  return sequence.flatMap((entry) =>
    'slotTypes' in entry && indexOfStep(entry, stories) < 0
      ? [{ key: entry.key, type: entry.slotTypes[0], required: entry.required }]
      : [],
  );
}

/**
 * Add a newly written story. If its type fills an open slot it goes where the template has
 * that step: before the first later step that has a story in the list, or at the end if
 * none is left. Anything else is appended.
 */
export function placeTemplateStory(
  stories: MemoryStory[],
  sequence: SequenceEntry[],
  story: MemoryStory,
): MemoryStory[] {
  const at = sequence.findIndex(
    (entry) => 'slotTypes' in entry && entry.slotTypes.includes(story.type) && indexOfStep(entry, stories) < 0,
  );
  const later = at < 0 ? [] : sequence.slice(at + 1).map((entry) => indexOfStep(entry, stories)).filter((i) => i >= 0);
  const index = later.length > 0 ? Math.min(...later) : stories.length;
  return renumber([...stories.slice(0, index), story, ...stories.slice(index)]);
}
