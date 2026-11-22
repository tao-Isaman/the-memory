import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeInternalPath, giftCreateUrl } from './funnel.ts';

test('safeInternalPath accepts only internal paths (open-redirect guard)', () => {
  assert.equal(safeInternalPath('/create?to=x'), '/create?to=x');
  assert.equal(safeInternalPath('/en/create'), '/en/create');
  // rejected: external / protocol-relative / scheme / empty
  assert.equal(safeInternalPath('//evil.com'), null);
  assert.equal(safeInternalPath('https://evil.com'), null);
  assert.equal(safeInternalPath('http://evil.com'), null);
  assert.equal(safeInternalPath('/\\evil.com'), null);
  assert.equal(safeInternalPath('evil.com'), null);
  assert.equal(safeInternalPath(''), null);
  assert.equal(safeInternalPath(null), null);
  assert.equal(safeInternalPath(undefined), null);
});

test('giftCreateUrl carries the recipient and campaign attribution', () => {
  const url = giftCreateUrl({ name: 'ชมพู่', src: 'qr_front' });
  const q = new URLSearchParams(url.split('?')[1]);
  assert.ok(url.startsWith('/create?'));
  assert.equal(q.get('to'), 'ชมพู่');
  assert.equal(q.get('utm_source'), 'gift');
  assert.equal(q.get('utm_medium'), 'minigame');
  assert.equal(q.get('utm_campaign'), 'xmas_ny');
  assert.equal(q.get('gift_src'), 'qr_front');
});

test('giftCreateUrl omits empty recipient/source but keeps utm', () => {
  const q = new URLSearchParams(giftCreateUrl({ name: '', src: '' }).split('?')[1]);
  assert.equal(q.get('to'), null);
  assert.equal(q.get('gift_src'), null);
  assert.equal(q.get('utm_source'), 'gift');
});
