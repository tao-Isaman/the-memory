// Run: npm test  (node --experimental-strip-types)
// /api/admin/users pages, searches, filters and sorts in the database; this is the one place request params are read.
import assert from 'node:assert/strict';
import { parseUsersQuery, usersQueryString, SORT_COLUMNS } from './admin-users-query.ts';

const q = (s) => parseUsersQuery(new URLSearchParams(s));

// Defaults: first page of 20, newest first.
assert.deepEqual(q(''), { page: 1, pageSize: 20, search: '', memories: 'all', paid: 'all', referral: 'all',
  sort: [{ column: 'created_at', ascending: false }] });

// Bad input never reaches PostgREST: page >= 1, size 1..100, unknown filter values and sort fields dropped.
assert.equal(q('page=-3').page, 1);
assert.equal(q('page=abc').page, 1);
assert.equal(q('pageSize=5000').pageSize, 100);
assert.equal(q('memories=evil').memories, 'all');
assert.deepEqual(q('sort=memoryCount:asc,password:desc,creditBalance:desc').sort,
  [{ column: 'memory_count', ascending: true }, { column: 'credit_balance', ascending: false }]);
assert.deepEqual(q('sort=nope:asc').sort, [{ column: 'created_at', ascending: false }]);

// Search: characters that mean something in a PostgREST or=() filter are removed; length capped.
assert.equal(q('q=a,b(c)*d%25e\\f').search, 'abcdef');
assert.equal(q('q=' + 'x'.repeat(200)).search.length, 100);
assert.equal(q('q=  Foo@Bar.com ').search, 'Foo@Bar.com');

// Every sort field the page offers has a column.
assert.deepEqual(Object.keys(SORT_COLUMNS).sort(), ['created_at', 'creditBalance', 'memoryCount', 'paidMemoryCount', 'profile', 'user_email']);

// The page builds the same query string the route parses.
const back = q(usersQueryString({ page: 3, search: 'a@b', memories: 'with', paid: 'unpaid', referral: 'all',
  sort: [{ field: 'paidMemoryCount', order: 'desc' }] }));
assert.equal(back.page, 3);
assert.equal(back.search, 'a@b');
assert.equal(back.memories, 'with');
assert.equal(back.paid, 'unpaid');
assert.deepEqual(back.sort, [{ column: 'paid_memory_count', ascending: false }]);

console.log('admin-users-query: ok');
