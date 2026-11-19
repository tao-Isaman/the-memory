// Run: npm test  (node --experimental-strip-types)
// Referral payouts: one request claims every right left; the admin pays one person's pending requests at once.
import assert from 'node:assert/strict';
import { CLAIM_UNIT_THB, claimedUnits, remainingUnits, overClaimed, groupPendingClaims, slipProblem, slipExtension } from './referral-claims.ts';

assert.equal(CLAIM_UNIT_THB, 50);

// Rights already used = sum(amount) / 50 — an old 50-baht row is one right, a new 150-baht row is three. Rejected rows
// still count (as they always did): a rejected request does not hand the right back.
assert.equal(claimedUnits([]), 0);
assert.equal(claimedUnits([{ amount: 50 }, { amount: 50 }]), 2);
assert.equal(claimedUnits([{ amount: 50 }, { amount: 150 }]), 4);
assert.equal(remainingUnits(5, [{ amount: 50 }, { amount: 100 }]), 2);
assert.equal(remainingUnits(1, [{ amount: 150 }]), 0); // never negative

// After inserting, the route re-reads every row: more than the paid referrals allow means a parallel request won.
assert.equal(overClaimed(3, [{ amount: 150 }]), false);
assert.equal(overClaimed(3, [{ amount: 150 }, { amount: 150 }]), true);

// Admin: pending rows of one person to one account become one payout; another account is its own group, and flagged.
const row = (id, over = {}) => ({ id, user_id: 'u1', user_email: 'a@x.com', amount: 50, status: 'pending', payment_method: 'promptpay',
  payment_info: '0812345678', bank_name: null, account_name: null, created_at: `2026-11-1${id}T00:00:00Z`, ...over });
const groups = groupPendingClaims([
  row('1'), row('2', { amount: 100 }), row('3', { payment_info: '081-234-5678' }), // same number, typed with dashes
  row('4', { payment_method: 'bank_transfer', payment_info: '1234567890', bank_name: 'KBank', account_name: 'A B' }),
  row('5', { user_id: 'u2', user_email: 'b@x.com' }),
  row('6', { status: 'completed' }), // only pending rows are paid
]);
assert.equal(groups.length, 3);
const [g1] = groups;
assert.deepEqual(g1.ids, ['1', '2', '3']);
assert.equal(g1.total, 200);
assert.equal(g1.count, 3);
assert.equal(g1.userEmail, 'a@x.com');
assert.equal(g1.otherAccounts, true); // u1 also asked to be paid into a bank account
const bank = groups.find((g) => g.paymentMethod === 'bank_transfer');
assert.deepEqual(bank.ids, ['4']);
assert.equal(bank.otherAccounts, true);
const u2 = groups.find((g) => g.userId === 'u2');
assert.equal(u2.otherAccounts, false);
// The same key is how the server checks that a payout's ids really are one group.
assert.equal(g1.key, groupPendingClaims([row('9', { payment_info: '0812 345 678' })])[0].key);

// Slips: jpg / png / webp up to 5 MB.
assert.equal(slipProblem({ type: 'image/png', size: 1000 }), null);
assert.equal(slipProblem({ type: 'image/webp', size: 5 * 1024 * 1024 }), null);
assert.equal(slipProblem({ type: 'image/gif', size: 1000 }), 'SLIP_TYPE');
assert.equal(slipProblem({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }), 'SLIP_TOO_BIG');
assert.equal(slipProblem({ type: 'image/jpeg', size: 0 }), 'SLIP_EMPTY');
assert.equal(slipExtension('image/jpeg'), 'jpg');

console.log('referral-claims: ok');
