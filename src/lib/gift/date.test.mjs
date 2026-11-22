import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayCode, todayCodeHint, effectForDate, bangkokParts } from './date.ts';

// All instants are given in UTC; Bangkok is UTC+7, so the local date can differ
// from the UTC date — the whole point of pinning the timezone.

test('todayCode is DDMM + Buddhist-year-2-digit in Bangkok time', () => {
  // 2026-11-23 12:00 Bangkok → 23/11/2569 → 231169
  assert.equal(todayCode(new Date('2026-11-23T05:00:00Z')), '231169');
  // 2025-01-05 09:00 Bangkok → 05/01/2568 → 050168
  assert.equal(todayCode(new Date('2025-01-05T02:00:00Z')), '050168');
});

test('todayCode respects the Bangkok day boundary, not UTC', () => {
  // 2026-12-26 23:30 UTC is already 2026-12-27 06:30 in Bangkok.
  assert.equal(todayCode(new Date('2026-12-26T23:30:00Z')), '271269');
  assert.equal(bangkokParts(new Date('2026-12-26T23:30:00Z')).dd, '27');
});

test('todayCodeHint is the spaced DD / MM / YY form', () => {
  assert.equal(todayCodeHint(new Date('2026-11-23T05:00:00Z')), '23 / 11 / 69');
});

test('effectForDate: snow through 26 Dec, fireworks 27 Dec – 15 Jan', () => {
  assert.equal(effectForDate(new Date('2026-12-20T05:00:00Z')), 'snow');
  assert.equal(effectForDate(new Date('2026-12-26T05:00:00Z')), 'snow'); // 26 Dec noon BKK
  assert.equal(effectForDate(new Date('2026-12-27T05:00:00Z')), 'fireworks');
  assert.equal(effectForDate(new Date('2027-01-01T05:00:00Z')), 'fireworks');
  assert.equal(effectForDate(new Date('2027-01-15T05:00:00Z')), 'fireworks');
  assert.equal(effectForDate(new Date('2027-01-16T05:00:00Z')), 'snow');
  assert.equal(effectForDate(new Date('2026-11-22T05:00:00Z')), 'snow'); // campaign default
});
