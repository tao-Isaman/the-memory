// /api/admin/users: what the admin users page asks for (page, search, filters, multi-sort), read and checked once.
// The route hands the result to PostgREST over admin_users_overview() (migration 039), so only one page of users
// ever leaves the database. Pure: shared by the route, the page and the test.

export type Tri = 'all' | 'with' | 'without';
export type PaidFilter = 'all' | 'paid' | 'unpaid';
export type SortFieldName = 'created_at' | 'memoryCount' | 'paidMemoryCount' | 'creditBalance' | 'user_email' | 'profile';

export const SORT_COLUMNS: Record<SortFieldName, string> = {
  created_at: 'created_at',
  memoryCount: 'memory_count',
  paidMemoryCount: 'paid_memory_count',
  creditBalance: 'credit_balance',
  user_email: 'user_email',
  profile: 'is_profile_complete',
};

export interface UsersQuery {
  page: number;
  pageSize: number;
  search: string;
  memories: Tri;
  paid: PaidFilter;
  referral: Tri;
  sort: { column: string; ascending: boolean }[];
}

const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback;

export function parseUsersQuery(p: URLSearchParams): UsersQuery {
  const page = Math.max(1, Math.floor(Number(p.get('page'))) || 1);
  const pageSize = Math.min(100, Math.max(1, Math.floor(Number(p.get('pageSize'))) || 20));
  // , ( ) * % \ shape a PostgREST or=() filter or an ilike pattern: never pass them through.
  const search = (p.get('q') || '').replace(/[,()*%\\]/g, '').trim().slice(0, 100);
  const sort = (p.get('sort') || '')
    .split(',')
    .map((part) => part.split(':'))
    .filter(([field]) => field in SORT_COLUMNS)
    .map(([field, order]) => ({ column: SORT_COLUMNS[field as SortFieldName], ascending: order === 'asc' }));
  return {
    page,
    pageSize,
    search,
    memories: pick(p.get('memories'), ['all', 'with', 'without'] as const, 'all'),
    paid: pick(p.get('paid'), ['all', 'paid', 'unpaid'] as const, 'all'),
    referral: pick(p.get('referral'), ['all', 'with', 'without'] as const, 'all'),
    sort: sort.length ? sort : [{ column: 'created_at', ascending: false }],
  };
}

/** The page's state as the route's query string. */
export function usersQueryString(s: {
  page: number; search: string; memories: Tri; paid: PaidFilter; referral: Tri;
  sort: { field: SortFieldName; order: 'asc' | 'desc' }[];
}): string {
  const p = new URLSearchParams({ page: String(s.page), q: s.search, memories: s.memories, paid: s.paid, referral: s.referral,
    sort: s.sort.map((x) => `${x.field}:${x.order}`).join(',') });
  return p.toString();
}
