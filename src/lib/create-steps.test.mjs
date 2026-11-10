// Run: npm test  (node --experimental-strip-types)
import assert from 'node:assert/strict';
import { missingItems, tabForMissing, nextTab, resolveLayout, CREATE_TABS, DEFAULT_CREATE_LAYOUT } from './create-steps.ts';

const ok = { title: 'ลอยกระทง', storyCount: 2, contentStoryCount: 1, requireContent: true, requiredSlotKeys: [] };

// Nothing missing: the memory can be saved.
assert.deepEqual(missingItems(ok), []);
// Same checks, same order, as the page has always enforced: title, then stories, then
// a template's required step.
assert.deepEqual(missingItems({ ...ok, title: '   ', storyCount: 0, contentStoryCount: 0, requiredSlotKeys: ['pin'] }), ['title', 'stories', 'slot:pin']);
assert.deepEqual(missingItems({ ...ok, title: '' }), ['title']);
assert.deepEqual(missingItems({ ...ok, storyCount: 0, contentStoryCount: 0 }), ['stories']);
// A new memory with only PIN pages has nothing to show the recipient: blocked.
assert.deepEqual(missingItems({ ...ok, storyCount: 1, contentStoryCount: 0 }), ['content']);
assert.deepEqual(missingItems({ ...ok, storyCount: 2, contentStoryCount: 1 }), []);
// An existing PIN-only memory (saved before this rule) can still be edited and saved.
assert.deepEqual(missingItems({ ...ok, storyCount: 1, contentStoryCount: 0, requireContent: false }), []);
assert.equal(tabForMissing('content'), 'stories');
// A template memory with stories but no PIN yet is still blocked.
assert.deepEqual(missingItems({ ...ok, requiredSlotKeys: ['pin'] }), ['slot:pin']);

// Each missing item is fixed on a known tab.
assert.equal(tabForMissing('title'), 'settings');
assert.equal(tabForMissing('stories'), 'stories');
assert.equal(tabForMissing('slot:pin'), 'stories');

// Settings -> stories -> review, and the last tab has no "next".
assert.deepEqual([...CREATE_TABS], ['settings', 'stories', 'review']);
assert.equal(nextTab('settings'), 'stories');
assert.equal(nextTab('stories'), 'review');
assert.equal(nextTab('review'), null);

// The URL flag picks the layout; anything else gets the default.
assert.equal(resolveLayout('tabs'), 'tabs');
assert.equal(resolveLayout('classic'), 'classic');
assert.equal(resolveLayout(null), DEFAULT_CREATE_LAYOUT);
assert.equal(resolveLayout('weird'), DEFAULT_CREATE_LAYOUT);
// Tabs is the default; the classic page stays one flag away.
assert.equal(DEFAULT_CREATE_LAYOUT, 'tabs');

console.log('create-steps.test: all assertions passed');
