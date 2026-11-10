// Run: npm test  (node --experimental-strip-types)
import assert from 'node:assert/strict';
import { getMemoryTemplate, buildTemplateDraft, placeTemplateStory, openSlots } from './memory-templates.ts';

const copy = { title: 'T', stories: { wish: { text: 'wish' }, closing: { text: 'bye' } } };
let n = 0;
const makeId = () => `id${++n}`;
const NOW = '2026-11-10T00:00:00.000Z';
const story = (id, type) => ({ id, type, priority: 99, createdAt: NOW, content: {} });
const ids = (list) => list.map((s) => s.id);
const slotKeys = (seq, list) => openSlots(seq, list).map((s) => s.key);

assert.equal(getMemoryTemplate('nope'), undefined);
assert.equal(getMemoryTemplate(null), undefined);
const tpl = getMemoryTemplate('loykrathong');
assert.ok(tpl);

// Draft: only complete stories are pre-filled. No PIN: a shared default code would be public.
const draft = buildTemplateDraft(tpl, copy, makeId, NOW);
const [WISH, CLOSING] = ids(draft.stories);
assert.equal(draft.title, 'T');
assert.equal(draft.theme, 'love');
assert.deepEqual(draft.stories.map((s) => s.type), ['text', 'text']);
assert.deepEqual(draft.stories.map((s) => s.priority), [0, 1]);
assert.equal(draft.stories[0].content.text, 'wish');
assert.equal(draft.stories[1].content.text, 'bye');
assert.deepEqual(
  openSlots(draft.sequence, draft.stories).map((s) => [s.key, s.type, s.required]),
  [['pin', 'password', true], ['photo', 'image', false], ['song', 'youtube', false]],
);
const seq = draft.sequence;

// Whatever order the user adds them in, stories land in template order:
// PIN, wish, photo, song, closing.
let list = placeTemplateStory(draft.stories, seq, story('S', 'youtube'));
assert.deepEqual(ids(list), [WISH, 'S', CLOSING]);
list = placeTemplateStory(list, seq, story('P', 'image'));
assert.deepEqual(ids(list), [WISH, 'P', 'S', CLOSING]);
list = placeTemplateStory(list, seq, story('PIN', 'password'));
assert.deepEqual(ids(list), ['PIN', WISH, 'P', 'S', CLOSING]);
assert.deepEqual(list.map((s) => s.priority), [0, 1, 2, 3, 4]);
assert.deepEqual(slotKeys(seq, list), []);

// Bug seen on prod: the user opens the "song" button, switches the type to PIN and saves.
// The story's own type decides everything: PIN slot closes, song slot stays open, PIN goes first.
list = placeTemplateStory(draft.stories, seq, story('PIN', 'password'));
assert.deepEqual(ids(list), ['PIN', WISH, CLOSING]);
assert.deepEqual(slotKeys(seq, list), ['photo', 'song']);
assert.equal(openSlots(seq, list).some((s) => s.required), false);

// A PIN added through the plain "add story" button counts too (same function, same result),
// and an album satisfies the photo slot just like a single image.
list = placeTemplateStory(list, seq, story('ALBUM', 'slideshow'));
assert.deepEqual(ids(list), ['PIN', WISH, 'ALBUM', CLOSING]);
assert.deepEqual(slotKeys(seq, list), ['song']);

// Types the template has no slot for, and second stories of a filled slot, go to the end.
list = placeTemplateStory(list, seq, story('Q', 'question'));
list = placeTemplateStory(list, seq, story('P2', 'image'));
assert.deepEqual(ids(list), ['PIN', WISH, 'ALBUM', CLOSING, 'Q', 'P2']);

// Deleting a slot's story reopens the slot; re-adding puts it back in place.
list = list.filter((s) => s.id !== 'PIN');
assert.deepEqual(slotKeys(seq, list), ['pin', 'song']);
list = placeTemplateStory(list, seq, story('PIN2', 'password'));
assert.equal(list[0].id, 'PIN2');

// If the user deleted the closing story, a slot story goes after what is left of the template.
list = placeTemplateStory([draft.stories[0]], seq, story('S', 'youtube'));
assert.deepEqual(ids(list), [WISH, 'S']);
list = placeTemplateStory(list, seq, story('P', 'image'));
assert.deepEqual(ids(list), [WISH, 'P', 'S']);

// No template (empty sequence): plain append.
assert.deepEqual(ids(placeTemplateStory(draft.stories, [], story('X', 'password'))), [WISH, CLOSING, 'X']);
assert.deepEqual(openSlots([], draft.stories), []);

console.log('memory-templates.test: all assertions passed');
