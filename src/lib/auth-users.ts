// Looking up auth users from admin routes. auth.admin.listUsers returns ONE page (the server caps its size), so
// "listUsers({ perPage: 10000 })" silently drops everyone past it — with 23k+ users the admin pages showed "Unknown".
// Known ids: ask for those users only. Everyone: walk every page.

/** The part of the Supabase client used here (the service client satisfies it). */
interface AdminAuth {
  auth: {
    admin: {
      listUsers(params?: { page?: number; perPage?: number }): Promise<{
        data: { users: AuthUserLite[]; nextPage?: number | null } | null;
        error: unknown;
      }>;
      getUserById(id: string): Promise<{ data: { user: AuthUserLite | null } | null; error: unknown }>;
    };
  };
}

export interface AuthUserLite {
  id: string;
  email?: string | null;
  created_at: string;
}

const PAGE_SIZE = 1000;
const MAX_PAGES = 500; // 500k users: a runaway loop guard, not a limit anyone reaches
const LOOKUPS_AT_ONCE = 10;

/** Every auth user, page by page (follows nextPage, so a smaller server page size is fine). */
export async function listAllAuthUsers<U extends AuthUserLite>(supabase: AdminAuth): Promise<U[]> {
  const out: U[] = [];
  for (let page = 1; page <= MAX_PAGES; ) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;
    const users = (data?.users ?? []) as U[];
    out.push(...users);
    if (!data?.nextPage || users.length === 0) return out;
    page = data.nextPage;
  }
  throw new Error('listAllAuthUsers: too many pages');
}

/** id -> email for just these users (each looked up once, a few at a time). Unknown ids are left out. */
export async function emailsByIds(supabase: AdminAuth, ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const out = new Map<string, string>();
  for (let i = 0; i < unique.length; i += LOOKUPS_AT_ONCE) {
    await Promise.all(unique.slice(i, i + LOOKUPS_AT_ONCE).map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      if (data?.user?.email) out.set(id, data.user.email);
    }));
  }
  return out;
}

/** The user id for an email (case-insensitive), searching every page; null when there is none. */
export async function findUserIdByEmail(supabase: AdminAuth, email: string): Promise<string | null> {
  const want = email.trim().toLowerCase();
  for (let page = 1; page <= MAX_PAGES; ) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw error;
    const hit = (data?.users ?? []).find((u) => u.email?.toLowerCase() === want);
    if (hit) return hit.id;
    if (!data?.nextPage || (data?.users ?? []).length === 0) return null;
    page = data.nextPage;
  }
  return null;
}
