import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeInternalPath, giftCreateUrl, loginDestination, onboardDestination } from './funnel.ts';

test('loginDestination: no/invalid next → /dashboard (existing users unchanged); valid next honoured', () => {
  assert.equal(loginDestination(null), '/dashboard');
  assert.equal(loginDestination(undefined), '/dashboard');
  assert.equal(loginDestination(''), '/dashboard');
  assert.equal(loginDestination('//evil.com'), '/dashboard'); // open-redirect → ignored, default
  assert.equal(loginDestination('https://evil.com'), '/dashboard');
  assert.equal(loginDestination('/create?to=x'), '/create?to=x');
});

test('onboardDestination: no gift context → /dashboard (normal new user unchanged); context → /create', () => {
  assert.equal(onboardDestination(null), '/dashboard');
  const dest = onboardDestination({ name: 'ชมพู่', src: 'qr' });
  assert.ok(dest.startsWith('/create?'));
  assert.equal(new URLSearchParams(dest.split('?')[1]).get('to'), 'ชมพู่');
});

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
