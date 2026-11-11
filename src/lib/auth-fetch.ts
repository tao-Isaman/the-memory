import { getSupabaseBrowserClient } from '@/lib/supabase';

/**
 * fetch() that sends the signed-in user's Supabase access token as
 * `Authorization: Bearer <jwt>`. API routes identify the caller from this
 * token (requireUser / requireAdmin in lib/supabase-server), never from a
 * userId in the body or query, so every call to a per-user or admin route
 * must go through here.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const client = getSupabaseBrowserClient();
  const token = (await client?.auth.getSession())?.data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
