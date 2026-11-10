// Run: npm test  (node --experimental-strip-types)
import assert from 'node:assert/strict';
import { getMemoryTemplate, buildTemplateDraft, fillTemplateSlot, openSlots } from './memory-templates.ts';

const copy = {
  title: 'T',
  stories: { pin: { title: 'hint' }, wish: { text: 'wish' }, closing: { text: 'bye' } },
};
let n = 0;
const makeId = () => `id${++n}`;
const NOW = '2026-11-10T00:00:00.000Z';
const story = (id, type = 'image') => ({ id, type, priority: 99, createdAt: NOW, content: { imageUrl: 'https://x/y.webp' } });

assert.equal(getMemoryTemplate('nope'), undefined);
assert.equal(getMemoryTemplate(null), undefined);
const tpl = getMemoryTemplate('loykrathong');
assert.ok(tpl);

// Draft: only complete stories are pre-filled; photo and song stay as open slots.
const draft = buildTemplateDraft(tpl, copy, makeId, NOW);
assert.equal(draft.title, 'T');
assert.equal(draft.theme, 'love');
assert.deepEqual(draft.stories.map((s) => s.type), ['password', 'text', 'text']);
assert.deepEqual(draft.stories.map((s) => s.priority), [0, 1, 2]);
assert.match(draft.stories[0].content.password, /^\d{6}$/);
assert.equal(draft.stories[0].title, 'hint');
assert.equal(draft.stories[1].content.text, 'wish');
assert.equal(draft.stories[2].content.text, 'bye');
assert.deepEqual(openSlots(draft.sequence, draft.stories).map((s) => [s.key, s.type]), [['photo', 'image'], ['song', 'youtube']]);

// Filling the song first, then the photo, still yields template order.
let state = fillTemplateSlot(draft.stories, draft.sequence, 'song', story('S', 'youtube'));
assert.deepEqual(state.stories.map((s) => s.type), ['password', 'text', 'youtube', 'text']);
state = fillTemplateSlot(state.stories, state.sequence, 'photo', story('P'));
assert.deepEqual(state.stories.map((s) => s.id), [draft.stories[0].id, draft.stories[1].id, 'P', 'S', draft.stories[2].id]);
assert.deepEqual(state.stories.map((s) => s.priority), [0, 1, 2, 3, 4]);
assert.deepEqual(openSlots(state.sequence, state.stories), []);

// If the user deleted the closing story, the slot story goes to the end.
const noClosing = draft.stories.slice(0, 2);
const appended = fillTemplateSlot(noClosing, draft.sequence, 'photo', story('P2'));
assert.deepEqual(appended.stories.map((s) => s.id), [noClosing[0].id, noClosing[1].id, 'P2']);

// Deleting a slot's story reopens the slot.
const reopened = state.stories.filter((s) => s.id !== 'P');
assert.deepEqual(openSlots(state.sequence, reopened).map((s) => s.key), ['photo']);

// Unknown slot key: plain append, nothing lost.
const odd = fillTemplateSlot(draft.stories, draft.sequence, 'zzz', story('Z'));
assert.equal(odd.stories.at(-1).id, 'Z');
assert.equal(odd.stories.length, 4);

console.log('memory-templates.test: all assertions passed');
