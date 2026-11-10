// Run: npm test  (node --experimental-strip-types)
import assert from 'node:assert/strict';
import { shouldShowLoyPopup, loyPopupKey, localDay } from './popup.ts';

const base = { seasonOpen: true, search: '', today: '2026-11-10', lastShownDay: null };

// First visit of the day during the season: show.
assert.equal(shouldShowLoyPopup(base), true);
// Outside the event window: never (it must disappear by itself after 25 Nov).
assert.equal(shouldShowLoyPopup({ ...base, seasonOpen: false }), false);
// At most once per day; a new day shows it again.
assert.equal(shouldShowLoyPopup({ ...base, lastShownDay: '2026-11-10' }), false);
assert.equal(shouldShowLoyPopup({ ...base, lastShownDay: '2026-11-09' }), true);
// Already heading into a template, or editing a memory: stay out of the way.
assert.equal(shouldShowLoyPopup({ ...base, search: '?template=loykrathong' }), false);
assert.equal(shouldShowLoyPopup({ ...base, search: '?edit=abc' }), false);
assert.equal(shouldShowLoyPopup({ ...base, search: '?foo=1' }), true);

// Remembered per user, so two accounts on one device do not share a dismissal.
assert.notEqual(loyPopupKey('a'), loyPopupKey('b'));
assert.equal(localDay(new Date(2026, 10, 5, 23, 59)), '2026-11-05');

console.log('popup.test: all assertions passed');
