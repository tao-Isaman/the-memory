// Run: npm test  (node --experimental-strip-types)
// auth.admin.listUsers returns one page; with 23k+ users the admin pages showed "Unknown" for everyone past it.
import assert from 'node:assert/strict';
import { listAllAuthUsers, emailsByIds, findUserIdByEmail } from './auth-users.ts';

const users = Array.from({ length: 2345 }, (_, i) => ({ id: `u${i}`, email: `p${i}@x.com`, created_at: '2026-11-01' }));
const calls = { list: 0, get: 0, inFlight: 0, maxInFlight: 0 };
const fake = {
  auth: {
    admin: {
      async listUsers({ page = 1, perPage = 50 } = {}) {
        calls.list++;
        const size = Math.min(perPage, 1000); // the server caps the page size: never trust perPage
        const slice = users.slice((page - 1) * size, page * size);
        const last = Math.ceil(users.length / size);
        return { data: { users: slice, nextPage: page < last ? page + 1 : null, lastPage: last, total: users.length }, error: null };
      },
      async getUserById(id) {
        calls.get++; calls.inFlight++; calls.maxInFlight = Math.max(calls.maxInFlight, calls.inFlight);
        await new Promise((r) => setTimeout(r, 1));
        calls.inFlight--;
        const u = users.find((x) => x.id === id);
        return u ? { data: { user: u }, error: null } : { data: { user: null }, error: { message: 'User not found' } };
      },
    },
  },
};

// Every page, even when the server returns fewer per page than asked.
const all = await listAllAuthUsers(fake);
assert.equal(all.length, 2345);
assert.equal(all.at(-1).id, 'u2344');

// Only the ids asked for, each once, a few at a time; an unknown id is simply missing from the map.
calls.get = 0;
const m = await emailsByIds(fake, ['u2000', 'u5', 'u2000', 'nope', null, undefined]);
assert.equal(m.get('u2000'), 'p2000@x.com');
assert.equal(m.get('u5'), 'p5@x.com');
assert.equal(m.has('nope'), false);
assert.equal(calls.get, 3);
const many = await emailsByIds(fake, users.slice(0, 40).map((u) => u.id));
assert.equal(many.size, 40);
assert.ok(calls.maxInFlight <= 10, `at most 10 lookups at once, saw ${calls.maxInFlight}`);

// Email search goes past the first page, case-insensitive, and stops once found.
calls.list = 0;
assert.equal(await findUserIdByEmail(fake, 'P2300@X.com'), 'u2300');
assert.equal(calls.list, 3);
assert.equal(await findUserIdByEmail(fake, 'nobody@x.com'), null);

console.log('auth-users: ok');
