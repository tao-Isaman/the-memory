// Validation for the float "kind" (river krathong vs sky lantern). This is exactly
// the gate the API route applies: POST /api/loykrathong/float calls isDesignForKind(kind, design)
// and returns 400 'design' when it is false.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isFloatKind,
  isKrathongDesign,
  isLanternDesign,
  isDesignForKind,
  LK_DESIGNS,
  LK_LANTERN_DESIGNS,
} from './config.ts';

test('isFloatKind accepts the two kinds, rejects anything else', () => {
  assert.equal(isFloatKind('krathong'), true);
  assert.equal(isFloatKind('lantern'), true);
  assert.equal(isFloatKind('boat'), false);
  assert.equal(isFloatKind(undefined), false);
});

test('a lantern design is valid for kind=lantern, not for kind=krathong', () => {
  for (const d of LK_LANTERN_DESIGNS) {
    assert.equal(isLanternDesign(d), true, `${d} should be a lantern design`);
    assert.equal(isDesignForKind('lantern', d), true, `lantern/${d} should be accepted`);
    assert.equal(isDesignForKind('krathong', d), false, `krathong/${d} should be rejected`);
  }
});

test('a krathong design is valid for kind=krathong, not for kind=lantern', () => {
  for (const d of LK_DESIGNS) {
    assert.equal(isKrathongDesign(d), true, `${d} should be a krathong design`);
    assert.equal(isDesignForKind('krathong', d), true, `krathong/${d} should be accepted`);
    assert.equal(isDesignForKind('lantern', d), false, `lantern/${d} should be rejected`);
  }
});

test('garbage designs are rejected for either kind', () => {
  for (const kind of ['krathong', 'lantern']) {
    assert.equal(isDesignForKind(kind, 'nope'), false);
    assert.equal(isDesignForKind(kind, ''), false);
    assert.equal(isDesignForKind(kind, 123), false);
  }
});
